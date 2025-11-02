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
      } else {
        // Try sAMAccountName format
        // You might need to construct: username@domain.com
        const domain = ldapConfig.baseDN
          .split(',')
          .filter(part => part.startsWith('dc='))
          .map(part => part.replace('dc=', ''))
          .join('.');
        userDN = `${username}@${domain}`;
      }

      // Try to bind (authenticate) with user credentials
      client.bind(userDN, password, (bindErr) => {
        if (bindErr) {
          console.error('LDAP bind error:', bindErr.message);
          client.unbind();
          resolve(null);
          return;
        }

        // Authentication successful, get user details
        this.getUserInfo(client, username, (userInfo) => {
          client.unbind();
          
          if (userInfo) {
            resolve(userInfo);
          } else {
            // Even if we can't get user info, authentication was successful
            // Return basic user info
            resolve({
              username,
              displayName: username.split('@')[0],
              email: username.includes('@') ? username : `${username}@espandarco.com`,
              groups: [],
            });
          }
        });
      });

      // Handle connection errors
      client.on('error', (err) => {
        console.error('LDAP connection error:', err.message);
        client.unbind();
        reject(err);
      });
    });
  }

  /**
   * Get user information from Active Directory
   */
  private getUserInfo(client: ldap.Client, username: string, callback: (user: ADUser | null) => void): void {
    const searchDN = ldapConfig.baseDN;
    
    // Extract username part (before @) for searching
    const usernamePart = username.split('@')[0];
    
    // Search filter - try both userPrincipalName and sAMAccountName
    const filter = `(&(objectClass=user)(|(userPrincipalName=${username})(sAMAccountName=${usernamePart})))`;
    
    const opts: ldap.SearchOptions = {
      filter,
      scope: 'sub',
      attributes: ['displayName', 'mail', 'memberOf', 'userPrincipalName', 'sAMAccountName', 'cn'],
      sizeLimit: 1, // Only need one result
    };

    let userFound = false;

    client.search(searchDN, opts, (searchErr, res) => {
      if (searchErr) {
        console.error('LDAP search error:', searchErr.message);
        callback(null);
        return;
      }

      res.on('searchEntry', (entry) => {
        userFound = true;
        
        try {
          const attrs = entry.pojo.attributes;
          
          const displayName = this.getAttribute(attrs, 'displayName') || 
                            this.getAttribute(attrs, 'cn') || 
                            username.split('@')[0];
          
          const email = this.getAttribute(attrs, 'mail') || 
                       this.getAttribute(attrs, 'userPrincipalName') || 
                       username;
          
          const memberOf = this.getAttribute(attrs, 'memberOf', true) || [];
          
          // Extract group names from DN format: CN=GroupName,OU=...
          const groups = memberOf.map((group: string) => {
            const match = group.match(/CN=([^,]+)/);
            return match ? match[1] : '';
          }).filter((g: string) => g && !g.startsWith('Domain Users'));

          callback({
            username: email.includes('@') ? email : username,
            displayName,
            email,
            groups: groups as string[],
          });
        } catch (error) {
          console.error('Error parsing LDAP entry:', error);
          callback(null);
        }
      });

      res.on('error', (err) => {
        console.error('LDAP search result error:', err.message);
        if (!userFound) {
          callback(null);
        }
      });

      res.on('end', () => {
        if (!userFound) {
          callback(null);
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

