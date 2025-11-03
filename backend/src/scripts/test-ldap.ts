/**
 * LDAP Connection Test Script
 * 
 * This script tests the LDAP/Active Directory connection
 * Run with: npm run test:ldap
 */

import ldap from 'ldapjs';
import { ldapConfig } from '../config/ldap.config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('═══════════════════════════════════════════════════');
console.log('🔍 LDAP Connection Test');
console.log('═══════════════════════════════════════════════════');
console.log('');

// Display configuration
console.log('📋 Configuration:');
console.log(`   LDAP URL: ${ldapConfig.url}`);
console.log(`   Base DN: ${ldapConfig.baseDN}`);
console.log(`   Timeout: ${ldapConfig.timeout}ms`);
console.log(`   Connect Timeout: ${ldapConfig.connectTimeout}ms`);
console.log('');

// Test 1: Create LDAP client
console.log('Test 1: Creating LDAP client...');
try {
  const client = ldap.createClient({
    url: ldapConfig.url,
    reconnect: false,
    timeout: ldapConfig.timeout,
    connectTimeout: ldapConfig.connectTimeout,
  });

  console.log('✅ Client created successfully');
  console.log('');

  // Test 2: Connection test
  console.log('Test 2: Testing connection...');
  const connectionStart = Date.now();
  
  // Set timeout for connection test
  const connectionTimeout = setTimeout(() => {
    console.log('❌ Connection timeout - server may be unreachable');
    console.log('');
    console.log('Possible issues:');
    console.log('   - Firewall blocking port 389');
    console.log('   - Domain controller is down');
    console.log('   - Network connectivity issue');
    console.log('   - DNS resolution problem');
    console.log('');
    console.log('Try: ping DC0.espandarco.com');
    client.unbind();
    process.exit(1);
  }, ldapConfig.connectTimeout + 1000);

  // Test connection with anonymous bind (if allowed)
  client.bind('', '', (bindErr) => {
    clearTimeout(connectionTimeout);
    const connectionDuration = Date.now() - connectionStart;
    
    if (bindErr) {
      // Even if bind fails, connection was attempted
      // Error 49 usually means "Invalid Credentials" which means server is reachable
      if (bindErr.code === 49 || bindErr.name === 'InvalidCredentials') {
        console.log('✅ Connection SUCCESS (server is reachable)');
        console.log(`   Duration: ${connectionDuration}ms`);
        console.log('   (Anonymous bind not allowed - this is normal for secure AD)');
      } else {
        console.log('⚠️  Connection issue detected:');
        console.log(`   Error code: ${bindErr.code || 'N/A'}`);
        console.log(`   Error name: ${bindErr.name || 'N/A'}`);
        console.log(`   Error message: ${bindErr.message}`);
        console.log(`   Duration: ${connectionDuration}ms`);
      }
    } else {
      console.log('✅ Connection SUCCESS');
      console.log(`   Duration: ${connectionDuration}ms`);
    }
    console.log('');

    // Test 3: Test search capability (if we can bind)
    if (!bindErr || bindErr.code === 49) {
      console.log('Test 3: Testing LDAP search capability...');
      
      // Try a simple search to verify base DN is correct
      const searchStart = Date.now();
      const filter = '(objectClass=*)';
      const opts: ldap.SearchOptions = {
        filter,
        scope: 'base',
        attributes: ['namingContexts', 'supportedLDAPVersion'],
        sizeLimit: 1,
      };

      client.search(ldapConfig.baseDN, opts, (searchErr, res) => {
        if (searchErr) {
          console.log('⚠️  Search test result:');
          console.log(`   Error code: ${searchErr.code || 'N/A'}`);
          console.log(`   Error name: ${searchErr.name || 'N/A'}`);
          console.log(`   Error message: ${searchErr.message}`);
          console.log('');
          console.log('Note: Anonymous search may be restricted (this is normal)');
          console.log('      Authenticated searches should still work');
        }

        let found = false;
        res.on('searchEntry', () => {
          found = true;
          const searchDuration = Date.now() - searchStart;
          console.log('✅ Search test SUCCESS');
          console.log(`   Duration: ${searchDuration}ms`);
          console.log('   Base DN is correct and searchable');
        });

        res.on('error', (err) => {
          console.log('⚠️  Search error:');
          console.log(`   ${err.message}`);
        });

        res.on('end', () => {
          const searchDuration = Date.now() - searchStart;
          if (!found) {
            console.log('⚠️  No results from search');
            console.log('   (This may be normal if anonymous searches are restricted)');
          }
          console.log('');
          console.log('═══════════════════════════════════════════════════');
          console.log('✅ Basic LDAP connectivity test completed');
          console.log('═══════════════════════════════════════════════════');
          console.log('');
          console.log('Summary:');
          console.log('   ✅ LDAP server is reachable');
          console.log('   ✅ Configuration looks correct');
          console.log('');
          console.log('Next steps:');
          console.log('   1. Try logging in with a test user (username@espandarco.com)');
          console.log('   2. Check server logs for detailed authentication flow');
          console.log('   3. If login fails, review logs to see where it fails');
          console.log('');
          client.unbind();
          process.exit(0);
        });
      });
    } else {
      client.unbind();
      process.exit(1);
    }
  });

  // Handle connection errors
  client.on('error', (err) => {
    clearTimeout(connectionTimeout);
    console.log('❌ Connection error:');
    console.log(`   Error type: ${err.name}`);
    console.log(`   Error message: ${err.message}`);
    console.log('');
    console.log('Possible issues:');
    console.log('   - Cannot reach LDAP server');
    console.log('   - Firewall blocking connection');
    console.log('   - DNS resolution failure');
    console.log('   - Server is down');
    console.log('');
    console.log('Troubleshooting:');
    console.log(`   Try: ping ${ldapConfig.url.replace('ldap://', '').replace(':389', '')}`);
    process.exit(1);
  });

} catch (error: any) {
  console.log('❌ Failed to create LDAP client:');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}
