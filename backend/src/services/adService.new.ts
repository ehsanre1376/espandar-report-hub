import ldap from 'ldapjs';
import { ldapConfig } from '../config/ldap.config';

export interface ADUser {
  username: string;
  displayName: string;
  email: string;
  groups?: string[];
}

interface LDAPAttribute {
  type: string;
  values?: string[];
}

export class ADService {
  async authenticate(username: string, password: string): Promise<ADUser | null> {
    const startTime = Date.now();
    const logPrefix = `[LDAP Auth] [${new Date().toISOString()}]`;
    
    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} Authentication attempt started`);
    console.log(`${logPrefix} Username received: "${username}"`);
    console.log(`${logPrefix} LDAP URL: ${ldapConfig.url}`);
    console.log(`${logPrefix} Base DN: ${ldapConfig.baseDN}`);
    
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: ldapConfig.url,
        reconnect: true,
        timeout: ldapConfig.timeout,
        connectTimeout: ldapConfig.connectTimeout,
      });

      // Extract username part and normalize to correct format
      let usernamePart = username.split('@')[0];
      
      // Normalize to the known working format "E.Rezaei"
      const nameParts = usernamePart.split('.');
      if (nameParts.length === 2) {
        usernamePart = `${nameParts[0].charAt(0).toUpperCase()}.${nameParts[1].charAt(0).toUpperCase()}${nameParts[1].slice(1).toLowerCase()}`;
      }

      const domain = ldapConfig.baseDN
        .split(',')
        .filter(part => part.startsWith('dc='))
        .map(part => part.replace('dc=', ''))
        .join('.');
      
      // Construct userPrincipalName with normalized format
      const userDN = `${usernamePart}@${domain}`;
      console.log(`${logPrefix} Using normalized sAMAccountName format: "${usernamePart}"`);
      console.log(`${logPrefix} Constructed userPrincipalName: "${userDN}"`);
      console.log(`${logPrefix} Original username provided: "${username}"`);

      console.log(`${logPrefix} Attempting LDAP bind with: "${userDN}"`);
      const bindStartTime = Date.now();

      client.bind(userDN, password, (bindErr) => {
        const bindDuration = Date.now() - bindStartTime;
        
        if (bindErr) {
          console.error(`${logPrefix} ❌ LDAP bind FAILED (${bindDuration}ms)`);
          console.error(`${logPrefix} Error code: ${bindErr.code || 'N/A'}`);
          console.error(`${logPrefix} Error name: ${bindErr.name || 'N/A'}`);
          console.error(`${logPrefix} Error message: ${bindErr.message}`);
          client.unbind();
          console.log(`${logPrefix} Total duration: ${Date.now() - startTime}ms`);
          console.log(`${logPrefix} ========================================`);
          resolve(null);
          return;
        }

        console.log(`${logPrefix} ✅ LDAP bind SUCCESS (${bindDuration}ms)`);
        console.log(`${logPrefix} Authentication successful, fetching user details...`);

        this.getUserInfo(client, userDN, (userInfo) => {
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
            console.log(`${logPrefix} ⚠️  Could not retrieve user info from AD, using basic info`);
            const basicUser = {
              username: userDN,
              displayName: usernamePart,
              email: userDN,
              groups: [],
            };
            console.log(`${logPrefix} Using basic user info:`, basicUser);
            console.log(`${logPrefix} Total duration: ${Date.now() - startTime}ms`);
            console.log(`${logPrefix} ========================================`);
            resolve(basicUser);
          }
        });
      });

      client.on('error', (err) => {
        console.error(`${logPrefix} ❌ LDAP connection error:`);
        console.error(`${logPrefix} Error type: ${err.name}`);
        console.error(`${logPrefix} Error message: ${err.message}`);
        console.log(`${logPrefix} Total duration: ${Date.now() - startTime}ms`);
        console.log(`${logPrefix} ========================================`);
        client.unbind();
        reject(err);
      });
    });
  }

  private getUserInfo(client: ldap.Client, userDN: string, callback: (user: ADUser | null) => void): void {
    const logPrefix = `[LDAP Search] [${new Date().toISOString()}]`;
    const searchStartTime = Date.now();
    const searchDN = ldapConfig.baseDN;
    
    // Extract and normalize username like the bind operation
    const usernamePart = userDN.split('@')[0];
    const nameParts = usernamePart.split('.');
    let normalizedUsername = usernamePart;
    if (nameParts.length === 2) {
      normalizedUsername = `${nameParts[0].charAt(0).toUpperCase()}.${nameParts[1].charAt(0).toUpperCase()}${nameParts[1].slice(1).toLowerCase()}`;
    }
    
    // Use the exact search filter that worked in the successful login
    const filter = `(&(objectClass=user)(sAMAccountName=${normalizedUsername}))`;
    
    console.log(`${logPrefix} Starting user search`);
    console.log(`${logPrefix} Search DN: "${searchDN}"`);
    console.log(`${logPrefix} Using normalized sAMAccountName: "${normalizedUsername}"`);
    console.log(`${logPrefix} Search filter: "${filter}"`);
    
    const opts: ldap.SearchOptions = {
      filter,
      scope: 'sub',
      attributes: ['displayName', 'mail', 'userPrincipalName', 'sAMAccountName', 'cn'],
      sizeLimit: 1,
    };

    let userFound = false;

    client.search(searchDN, opts, (searchErr, res) => {
      if (searchErr) {
        console.error(`${logPrefix} ❌ LDAP search ERROR`);
        console.error(`${logPrefix} Error name: ${searchErr.name || 'N/A'}`);
        console.error(`${logPrefix} Error message: ${searchErr.message}`);
        callback(null);
        return;
      }

      res.on('searchEntry', (entry) => {
        userFound = true;
        const entryTime = Date.now() - searchStartTime;
        console.log(`${logPrefix} ✅ Search entry found (${entryTime}ms)`);
        
        try {
          const attrs = entry.pojo.attributes as LDAPAttribute[];
          console.log(`${logPrefix} Available attributes:`, attrs.map(a => a.type).join(', '));
          
          const displayName = this.getAttribute(attrs, 'displayName') || 
                            this.getAttribute(attrs, 'cn') || 
                            usernamePart;
          
          const email = this.getAttribute(attrs, 'mail') || 
                       this.getAttribute(attrs, 'userPrincipalName') || 
                       userDN;
          
          const userInfo = {
            username: email,
            displayName,
            email,
            groups: [] as string[],
          };
          
          callback(userInfo);
        } catch (error) {
          console.error(`${logPrefix} ❌ Error parsing LDAP entry:`, error);
          callback(null);
        }
      });

      res.on('error', (err) => {
        console.error(`${logPrefix} ❌ LDAP search result error`);
        console.error(`${logPrefix} Error message: ${err.message}`);
        if (!userFound) {
          callback(null);
        }
      });

      res.on('end', () => {
        const searchDuration = Date.now() - searchStartTime;
        if (!userFound) {
          console.log(`${logPrefix} ⚠️  Search completed but NO user found (${searchDuration}ms)`);
          callback(null);
        } else {
          console.log(`${logPrefix} Search completed successfully (${searchDuration}ms)`);
        }
      });
    });
  }

  private getAttribute(attrs: LDAPAttribute[], name: string, multiple = false): string | string[] | null {
    const attr = attrs.find(a => a.type.toLowerCase() === name.toLowerCase());
    if (!attr) return multiple ? [] : null;
    
    if (multiple) {
      return attr.values || [];
    }
    
    return attr.values && attr.values.length > 0 ? attr.values[0] : null;
  }
}