import ldap from 'ldapjs';
import { ldapConfig } from '../config/ldap.config';

export interface ADUser {
  username: string;
  displayName: string;
  email: string;
  groups?: string[];
}

export class ADService {
  /**
   * Authenticate user against Active Directory
   * 
   * @param username - User's username (user@espandarco.com or username)
   * @param password - User's password
   * @returns User information if authenticated, null otherwise
   */
  async authenticate(username: string, password: string): Promise<ADUser | null> {
    const startTime = Date.now();
    const logPrefix = `[LDAP Auth] [${new Date().toISOString()}]`;
    
    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} Authentication attempt started`);
    console.log(`${logPrefix} Username received: "${username}"`);
    console.log(`${logPrefix} LDAP URL: ${ldapConfig.url}`);
    console.log(`${logPrefix} Base DN: ${ldapConfig.baseDN}`);
    
    return new Promise((resolve, reject) => {
      // Create LDAP client
      const client = ldap.createClient({
        url: ldapConfig.url,
        reconnect: true,
        timeout: ldapConfig.timeout,
        connectTimeout: ldapConfig.connectTimeout,
      });

      // Format username for LDAP DN
      // Try userPrincipalName format first (user@domain.com)
      let userDN: string;
      
      if (username.includes('@')) {
        // Already in userPrincipalName format
        userDN = username;
        console.log(`${logPrefix} Using userPrincipalName format: "${userDN}"`);
      } else {
        // Try sAMAccountName format
        // You might need to construct: username@domain.com
        const domain = ldapConfig.baseDN
          .split(',')
          .filter(part => part.startsWith('dc='))
          .map(part => part.replace('dc=', ''))
          .join('.');
        userDN = `${username}@${domain}`;
        console.log(`${logPrefix} Constructed userPrincipalName from sAMAccountName: "${userDN}"`);
      }

      console.log(`${logPrefix} Attempting LDAP bind with: "${userDN}"`);
      const bindStartTime = Date.now();

      // Try to bind (authenticate) with user credentials
      client.bind(userDN, password, (bindErr) => {
        const bindDuration = Date.now() - bindStartTime;
        
        if (bindErr) {
          console.error(`${logPrefix} ❌ LDAP bind FAILED (${bindDuration}ms)`);
          console.error(`${logPrefix} Error code: ${bindErr.code || 'N/A'}`);
          console.error(`${logPrefix} Error name: ${bindErr.name || 'N/A'}`);
          console.error(`${logPrefix} Error message: ${bindErr.message}`);
          console.error(`${logPrefix} UserDN used: "${userDN}"`);
          console.error(`${logPrefix} Username format: ${username.includes('@') ? 'userPrincipalName' : 'sAMAccountName'}`);
          
          // Try alternative bind if userPrincipalName failed
          if (username.includes('@')) {
            console.log(`${logPrefix} Attempting alternative bind with sAMAccountName format...`);
            const usernamePart = username.split('@')[0];
            const domain = ldapConfig.baseDN
              .split(',')
              .filter(part => part.startsWith('dc='))
              .map(part => part.replace('dc=', ''))
              .join('.');
            const altUserDN = `${usernamePart}@${domain}`;
            
            if (altUserDN !== userDN) {
              console.log(`${logPrefix} Trying alternative: "${altUserDN}"`);
              // Note: We can't retry bind in the same callback, but we log for debugging
              console.error(`${logPrefix} Suggestion: User might need different format or account might be disabled`);
            }
          }
          
          client.unbind();
          console.log(`${logPrefix} Total duration: ${Date.now() - startTime}ms`);
          console.log(`${logPrefix} ========================================`);
          resolve(null);
          return;
        }

        console.log(`${logPrefix} ✅ LDAP bind SUCCESS (${bindDuration}ms)`);
        console.log(`${logPrefix} Authentication successful, fetching user details...`);

        // Authentication successful, get user details
        this.getUserInfo(client, username, (userInfo) => {
          client.unbind();
          
          if (userInfo) {
            console.log(`${logPrefix} ✅ User info retrieved successfully`);
            console.log(`${logPrefix} User details:`, {
              username: userInfo.username,
              displayName: userInfo.displayName,
              email: userInfo.email,
              groupsCount: userInfo.groups?.length || 0
            });
            console.log(`${logPrefix} Total duration: ${Date.now() - startTime}ms`);
            console.log(`${logPrefix} ========================================`);
            resolve(userInfo);
          } else {
            // Even if we can't get user info, authentication was successful
            console.log(`${logPrefix} ⚠️  Could not retrieve user info from AD, using basic info`);
            // Construct domain from baseDN if username doesn't have @
            const domain = ldapConfig.baseDN
              .split(',')
              .filter(part => part.startsWith('dc='))
              .map(part => part.replace('dc=', ''))
              .join('.');
            const basicUser = {
              username,
              displayName: username.split('@')[0],
              email: username.includes('@') ? username : `${username}@${domain}`,
              groups: [],
            };
            console.log(`${logPrefix} Using basic user info:`, basicUser);
            console.log(`${logPrefix} Total duration: ${Date.now() - startTime}ms`);
            console.log(`${logPrefix} ========================================`);
            resolve(basicUser);
          }
        });
      });

      // Handle connection errors
      client.on('error', (err) => {
        console.error(`${logPrefix} ❌ LDAP connection error:`);
        console.error(`${logPrefix} Error type: ${err.name}`);
        console.error(`${logPrefix} Error message: ${err.message}`);
        console.error(`${logPrefix} Error code: ${(err as any).code || 'N/A'}`);
        console.log(`${logPrefix} Total duration: ${Date.now() - startTime}ms`);
        console.log(`${logPrefix} ========================================`);
        client.unbind();
        reject(err);
      });
    });
  }

  /**
   * Get user information from Active Directory
   */
  private getUserInfo(client: ldap.Client, username: string, callback: (user: ADUser | null) => void): void {
    const logPrefix = `[LDAP Search] [${new Date().toISOString()}]`;
    const searchStartTime = Date.now();
    const searchDN = ldapConfig.baseDN;
    
    // Extract username part (before @) for searching
    const usernamePart = username.split('@')[0];
    
    // Search filter - try both userPrincipalName and sAMAccountName
    const filter = `(&(objectClass=user)(|(userPrincipalName=${username})(sAMAccountName=${usernamePart})))`;
    
    console.log(`${logPrefix} Starting user search`);
    console.log(`${logPrefix} Search DN: "${searchDN}"`);
    console.log(`${logPrefix} Username part: "${usernamePart}"`);
    console.log(`${logPrefix} Full username: "${username}"`);
    console.log(`${logPrefix} Search filter: "${filter}"`);
    
    const opts: ldap.SearchOptions = {
      filter,
      scope: 'sub',
      attributes: ['displayName', 'mail', 'memberOf', 'userPrincipalName', 'sAMAccountName', 'cn'],
      sizeLimit: 1, // Only need one result
    };

    let userFound = false;

    client.search(searchDN, opts, (searchErr, res) => {
      if (searchErr) {
        console.error(`${logPrefix} ❌ LDAP search ERROR`);
        console.error(`${logPrefix} Error code: ${searchErr.code || 'N/A'}`);
        console.error(`${logPrefix} Error name: ${searchErr.name || 'N/A'}`);
        console.error(`${logPrefix} Error message: ${searchErr.message}`);
        console.error(`${logPrefix} Search duration: ${Date.now() - searchStartTime}ms`);
        callback(null);
        return;
      }

      console.log(`${logPrefix} Search initiated, waiting for results...`);

      res.on('searchEntry', (entry) => {
        userFound = true;
        const entryTime = Date.now() - searchStartTime;
        console.log(`${logPrefix} ✅ Search entry found (${entryTime}ms)`);
        
        try {
          const attrs = entry.pojo.attributes;
          console.log(`${logPrefix} Available attributes:`, attrs.map((a: any) => a.type).join(', '));
          
          const displayName = this.getAttribute(attrs, 'displayName') || 
                            this.getAttribute(attrs, 'cn') || 
                            username.split('@')[0];
          
          const email = this.getAttribute(attrs, 'mail') || 
                       this.getAttribute(attrs, 'userPrincipalName') || 
                       username;
          
          const userPrincipalName = this.getAttribute(attrs, 'userPrincipalName');
          const sAMAccountName = this.getAttribute(attrs, 'sAMAccountName');
          
          console.log(`${logPrefix} Attribute values:`);
          console.log(`${logPrefix}   - displayName: "${displayName}"`);
          console.log(`${logPrefix}   - mail: "${this.getAttribute(attrs, 'mail')}"`);
          console.log(`${logPrefix}   - userPrincipalName: "${userPrincipalName}"`);
          console.log(`${logPrefix}   - sAMAccountName: "${sAMAccountName}"`);
          
          const memberOf = this.getAttribute(attrs, 'memberOf', true) || [];
          console.log(`${logPrefix}   - memberOf count: ${memberOf.length}`);
          
          // Extract group names from DN format: CN=GroupName,OU=...
          const groups = memberOf.map((group: string) => {
            const match = group.match(/CN=([^,]+)/);
            return match ? match[1] : '';
          }).filter((g: string) => g && !g.startsWith('Domain Users'));
          
          console.log(`${logPrefix}   - Groups (filtered): ${groups.length}`);

          const userInfo = {
            username: email.includes('@') ? email : username,
            displayName,
            email,
            groups: groups as string[],
          };
          
          callback(userInfo);
        } catch (error) {
          console.error(`${logPrefix} ❌ Error parsing LDAP entry:`, error);
          if (error instanceof Error) {
            console.error(`${logPrefix} Error stack:`, error.stack);
          }
          callback(null);
        }
      });

      res.on('error', (err) => {
        console.error(`${logPrefix} ❌ LDAP search result error`);
        console.error(`${logPrefix} Error message: ${err.message}`);
        console.error(`${logPrefix} Error code: ${(err as any).code || 'N/A'}`);
        console.error(`${logPrefix} Search duration: ${Date.now() - searchStartTime}ms`);
        if (!userFound) {
          console.log(`${logPrefix} No user found, returning null`);
          callback(null);
        }
      });

      res.on('end', () => {
        const searchDuration = Date.now() - searchStartTime;
        if (!userFound) {
          console.log(`${logPrefix} ⚠️  Search completed but NO user found (${searchDuration}ms)`);
          console.log(`${logPrefix} This might indicate:`);
          console.log(`${logPrefix}   1. User doesn't exist in AD`);
          console.log(`${logPrefix}   2. UserPrincipalName mismatch`);
          console.log(`${logPrefix}   3. sAMAccountName mismatch`);
          console.log(`${logPrefix}   4. User might be in different OU`);
          console.log(`${logPrefix}   5. Search permissions issue`);
          callback(null);
        } else {
          console.log(`${logPrefix} Search completed successfully (${searchDuration}ms)`);
        }
      });
    });
  }

  /**
   * Helper to get attribute value from LDAP entry
   */
  private getAttribute(attrs: any[], name: string, multiple: boolean = false): any {
    const attr = attrs.find(a => a.type.toLowerCase() === name.toLowerCase());
    if (!attr) return multiple ? [] : null;
    
    if (multiple) {
      return attr.values || [];
    }
    
    return attr.values && attr.values.length > 0 ? attr.values[0] : null;
  }
}

