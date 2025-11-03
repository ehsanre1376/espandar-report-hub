/**
 * Test both DC0 and DC1 with a username
 */

import ldap from 'ldapjs';
import { ldapConfig } from '../config/ldap.config';
import * as dotenv from 'dotenv';

dotenv.config();

const username = process.argv[2];

if (!username) {
  console.log('Usage: npm run test:both-dcs <username>');
  console.log('Example: npm run test:both-dcs username');
  process.exit(1);
}
const baseDN = ldapConfig.baseDN;

console.log('═══════════════════════════════════════════════════');
console.log('🔍 Testing Both Domain Controllers');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log(`Username: ${username}`);
console.log(`Base DN: ${baseDN}`);
console.log('');

const domain = baseDN.split(',')
  .filter(part => part.startsWith('dc='))
  .map(part => part.replace('dc=', ''))
  .join('.');

const userPrincipalName = username.includes('@') ? username : `${username}@${domain}`;
const usernamePart = username.split('@')[0];

const testDC = async (dcName: string, dcUrl: string) => {
  return new Promise<{ success: boolean; error?: string; userFound?: boolean; data?: any }>((resolve) => {
    console.log(`\n📡 Testing ${dcName}...`);
    console.log(`   URL: ${dcUrl}`);
    
    const client = ldap.createClient({
      url: dcUrl,
      reconnect: false,
      timeout: 5000,
      connectTimeout: 5000,
    });

    let connectionEstablished = false;

    client.on('error', (err) => {
      if (!connectionEstablished) {
        resolve({ success: false, error: `Connection error: ${err.message}` });
      }
    });

    // Test connection
    client.bind('', '', (bindErr) => {
      if (bindErr && bindErr.code !== 49) {
        resolve({ success: false, error: `Bind error: ${bindErr.message}` });
        return;
      }
      
      connectionEstablished = true;
      console.log(`   ✅ Connected to ${dcName}`);
      
      // Try search with user credentials - we'll try multiple filters
      const filters = [
        `(&(objectClass=user)(userPrincipalName=${userPrincipalName}))`,
        `(&(objectClass=user)(sAMAccountName=${usernamePart}))`,
        `(&(objectClass=user)(|(userPrincipalName=${userPrincipalName})(sAMAccountName=${usernamePart})))`,
        `(&(objectClass=user)(cn=${usernamePart}))`,
        `(&(objectClass=user)(cn=*${usernamePart}*))`,
      ];

      let filterIndex = 0;

      const trySearch = () => {
        if (filterIndex >= filters.length) {
          console.log(`   ❌ User not found with any filter`);
          client.unbind();
          resolve({ success: true, userFound: false });
          return;
        }

        const filter = filters[filterIndex];
        console.log(`   🔍 Trying filter ${filterIndex + 1}: ${filter.substring(0, 60)}...`);

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
            'distinguishedName'
          ],
          sizeLimit: 5,
        };

        client.search(baseDN, opts, (searchErr, res) => {
          if (searchErr) {
            if (searchErr.code === 1 || searchErr.name === 'OperationsError') {
              // Anonymous search not allowed, try next filter or conclude
              console.log(`   ⚠️  Anonymous search not allowed (normal)`);
              filterIndex++;
              trySearch();
              return;
            }
            console.log(`   ❌ Search error: ${searchErr.message}`);
            filterIndex++;
            trySearch();
            return;
          }

          let found = false;
          let userData: any = null;

          res.on('searchEntry', (entry) => {
            found = true;
            const attrs = entry.pojo.attributes;
            
            const getAttr = (name: string) => {
              const attr = attrs.find((a: any) => a.type.toLowerCase() === name.toLowerCase());
              return attr && attr.values && attr.values.length > 0 ? attr.values[0] : null;
            };

            userData = {
              displayName: getAttr('displayName'),
              userPrincipalName: getAttr('userPrincipalName'),
              sAMAccountName: getAttr('sAMAccountName'),
              mail: getAttr('mail'),
              cn: getAttr('cn'),
              givenName: getAttr('givenName'),
              sn: getAttr('sn'),
              distinguishedName: getAttr('distinguishedName'),
            };
          });

          res.on('end', () => {
            if (found) {
              console.log(`   ✅ USER FOUND!`);
              console.log(`      Display Name: ${userData.displayName || 'N/A'}`);
              console.log(`      User Principal: ${userData.userPrincipalName || 'N/A'}`);
              console.log(`      SAM Account: ${userData.sAMAccountName || 'N/A'}`);
              console.log(`      Email: ${userData.mail || 'N/A'}`);
              console.log(`      CN: ${userData.cn || 'N/A'}`);
              client.unbind();
              resolve({ success: true, userFound: true, data: userData });
            } else {
              filterIndex++;
              trySearch();
            }
          });

          res.on('error', () => {
            filterIndex++;
            trySearch();
          });
        });
      };

      trySearch();
    });
  });
};

(async () => {
  const results = await Promise.all([
    testDC('DC0', 'ldap://DC0.espandarco.com:389'),
    testDC('DC1', 'ldap://DC1.espandarco.com:389'),
  ]);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 Summary');
  console.log('═══════════════════════════════════════════════════\n');

  results.forEach((result, index) => {
    const dcName = index === 0 ? 'DC0' : 'DC1';
    if (!result.success) {
      console.log(`${dcName}: ❌ Failed - ${result.error}`);
    } else if (result.userFound) {
      console.log(`${dcName}: ✅ User found`);
      console.log(`   Use login format: ${result.data.userPrincipalName || result.data.sAMAccountName || 'N/A'}`);
    } else {
      console.log(`${dcName}: ⚠️  Connected but user not found`);
    }
  });

  console.log('\n💡 Troubleshooting:');
  console.log('   - If user not found: Check username format in AD');
  console.log('   - Try different username formats (e.g., first.last, flast, etc.)');
  console.log('   - Ask IT for the exact userPrincipalName or sAMAccountName');
  console.log('');

  process.exit(0);
})();

