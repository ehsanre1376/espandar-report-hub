/**
 * LDAP User Search Test Script
 * 
 * This script tests if we can search for and retrieve user information from AD
 * Run with: npm run test:ldap:user
 * 
 * Usage: node test-ldap-user.js <username>
 * Example: node test-ldap-user.js username
 */

import ldap from 'ldapjs';
import { ldapConfig } from '../config/ldap.config';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

console.log('═══════════════════════════════════════════════════');
console.log('🔍 LDAP User Search Test');
console.log('═══════════════════════════════════════════════════');
console.log('');

// Get username from command line or prompt
const username = process.argv[2];

if (!username) {
  console.log('Usage: npm run test:ldap:user <username>');
  console.log('Example: npm run test:ldap:user username');
  console.log('');
  process.exit(1);
}

console.log('📋 Configuration:');
console.log(`   LDAP URL: ${ldapConfig.url}`);
console.log(`   Base DN: ${ldapConfig.baseDN}`);
console.log(`   Searching for: ${username}`);
console.log('');

// Create LDAP client
console.log('Creating LDAP client...');
const client = ldap.createClient({
  url: ldapConfig.url,
  reconnect: false,
  timeout: ldapConfig.timeout,
  connectTimeout: ldapConfig.connectTimeout,
});

let connectionEstablished = false;

// Handle connection errors
client.on('error', (err) => {
  if (!connectionEstablished) {
    console.log('❌ Connection error:');
    console.log(`   Error type: ${err.name}`);
    console.log(`   Error message: ${err.message}`);
    console.log('');
    process.exit(1);
  }
});

// Try anonymous bind first to test connection
console.log('Step 1: Testing connection...');
client.bind('', '', (bindErr) => {
  if (bindErr && bindErr.code !== 49) {
    console.log('❌ Connection failed:');
    console.log(`   Error: ${bindErr.message}`);
    process.exit(1);
  }
  
  connectionEstablished = true;
  console.log('✅ Connection established');
  console.log('');
  
  // Step 2: Try to search for user
  console.log('Step 2: Searching for user...');
  
  // Construct search filters - try multiple formats
  const usernamePart = username.split('@')[0];
  const domain = ldapConfig.baseDN
    .split(',')
    .filter(part => part.startsWith('dc='))
    .map(part => part.replace('dc=', ''))
    .join('.');
  
  const userPrincipalName = username.includes('@') ? username : `${username}@${domain}`;
  
  console.log(`   Trying userPrincipalName: ${userPrincipalName}`);
  console.log(`   Trying sAMAccountName: ${usernamePart}`);
  console.log('');
  
  // Search filter - try both userPrincipalName and sAMAccountName
  const filter = `(&(objectClass=user)(|(userPrincipalName=${userPrincipalName})(sAMAccountName=${usernamePart})))`;
  
  console.log(`   Search filter: ${filter}`);
  console.log(`   Base DN: ${ldapConfig.baseDN}`);
  console.log('');
  
  const searchStart = Date.now();
  const opts: ldap.SearchOptions = {
    filter,
    scope: 'sub',
    attributes: [
      'displayName',
      'mail',
      'userPrincipalName',
      'sAMAccountName',
      'cn',
      'givenName',
      'sn',
      'memberOf',
      'distinguishedName'
    ],
    sizeLimit: 5,
  };

  client.search(ldapConfig.baseDN, opts, (searchErr, res) => {
    if (searchErr) {
      console.log('❌ Search error:');
      console.log(`   Error code: ${searchErr.code || 'N/A'}`);
      console.log(`   Error name: ${searchErr.name || 'N/A'}`);
      console.log(`   Error message: ${searchErr.message}`);
      console.log('');
      console.log('Possible issues:');
      console.log('   - Anonymous search not allowed (normal for secure AD)');
      console.log('   - User does not exist');
      console.log('   - Base DN incorrect');
      client.unbind();
      process.exit(1);
    }

    let userFound = false;
    let resultCount = 0;

    res.on('searchEntry', (entry) => {
      resultCount++;
      userFound = true;
      const searchDuration = Date.now() - searchStart;
      
      console.log(`✅ User found! (${searchDuration}ms)`);
      console.log('');
      
      try {
        const attrs = entry.pojo.attributes;
        console.log('📋 User Attributes:');
        console.log('');
        
        // Helper to get attribute
        const getAttr = (name: string) => {
          const attr = attrs.find((a: any) => a.type.toLowerCase() === name.toLowerCase());
          return attr && attr.values && attr.values.length > 0 ? attr.values[0] : null;
        };
        
        const getAttrArray = (name: string) => {
          const attr = attrs.find((a: any) => a.type.toLowerCase() === name.toLowerCase());
          return attr && attr.values ? attr.values : [];
        };
        
        // Display important attributes
        const displayName = getAttr('displayName');
        const userPrincipalName = getAttr('userPrincipalName');
        const sAMAccountName = getAttr('sAMAccountName');
        const mail = getAttr('mail');
        const cn = getAttr('cn');
        const givenName = getAttr('givenName');
        const sn = getAttr('sn');
        const distinguishedName = getAttr('distinguishedName');
        const memberOf = getAttrArray('memberOf');
        
        console.log(`   Display Name:      ${displayName || 'N/A'}`);
        console.log(`   User Principal:    ${userPrincipalName || 'N/A'}`);
        console.log(`   SAM Account:       ${sAMAccountName || 'N/A'}`);
        console.log(`   Email:             ${mail || 'N/A'}`);
        console.log(`   Common Name:       ${cn || 'N/A'}`);
        console.log(`   Given Name:        ${givenName || 'N/A'}`);
        console.log(`   Surname:           ${sn || 'N/A'}`);
        console.log(`   Distinguished DN:  ${distinguishedName || 'N/A'}`);
        console.log(`   Member Of:         ${memberOf.length} groups`);
        
        if (memberOf.length > 0) {
          console.log('');
          console.log('   Groups:');
          memberOf.slice(0, 10).forEach((group: string) => {
            const match = group.match(/CN=([^,]+)/);
            if (match) {
              console.log(`      - ${match[1]}`);
            }
          });
          if (memberOf.length > 10) {
            console.log(`      ... and ${memberOf.length - 10} more`);
          }
        }
        
        console.log('');
        console.log('✅ User information retrieved successfully!');
        
      } catch (error: any) {
        console.log('⚠️  Error parsing user attributes:');
        console.log(`   ${error.message}`);
        client.unbind();
        process.exit(1);
      }
    });

    res.on('error', (err) => {
      console.log('⚠️  Search result error:');
      console.log(`   ${err.message}`);
    });

    res.on('end', () => {
      const searchDuration = Date.now() - searchStart;
      
      if (!userFound) {
        console.log(`❌ User not found (${searchDuration}ms)`);
        console.log('');
        console.log('Possible reasons:');
        console.log(`   1. Username "${username}" doesn't exist in AD`);
        console.log(`   2. UserPrincipalName doesn't match "${userPrincipalName}"`);
        console.log(`   3. sAMAccountName doesn't match "${usernamePart}"`);
        console.log(`   4. Anonymous search not allowed (need authenticated bind)`);
        console.log(`   5. User is in different OU`);
        console.log('');
        console.log('Note: Anonymous searches are often restricted.');
        console.log('      Try authenticating with user credentials to search.');
      } else {
        console.log(`✅ Search completed (${searchDuration}ms, ${resultCount} result(s))`);
      }
      
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      client.unbind();
      process.exit(userFound ? 0 : 1);
    });
  });
});

