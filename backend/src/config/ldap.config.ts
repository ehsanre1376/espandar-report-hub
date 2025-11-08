/**
 * LDAP/Active Directory Configuration
 * 
 * This file contains your Active Directory connection settings.
 * Update these values with your actual AD server information.
 */

export const ldapConfig = {
  // LDAP Server URL
  // Format: ldap://your-domain-controller:389
  // Or for secure: ldaps://your-domain-controller:636
  // Primary DC: DC0.espandarco.com, Backup: DC1.espandarco.com
  url: process.env.LDAP_URL || 'ldap://DC1.espandarco.com:389',
  
  // Base DN (Domain Name)
  // Format: dc=espandarco,dc=com
  // Forest: espandarco.com
  baseDN: process.env.LDAP_BASE_DN || 'dc=espandarco,dc=com',
  
  // Optional: Service account for LDAP queries (if required)
  // Only needed if you need to query AD before binding user
  bindDN: process.env.LDAP_BIND_DN || '',
  bindPassword: process.env.LDAP_BIND_PASSWORD || '',
  
  // Timeout settings
  timeout: parseInt(process.env.LDAP_TIMEOUT || '5000', 10),
  connectTimeout: parseInt(process.env.LDAP_CONNECT_TIMEOUT || '5000', 10),

  // NTLM Configuration (for automatic Windows authentication)
  // Domain name (without .com extension)
  ntlmDomain: process.env.NTLM_DOMAIN || 'espandarco',
  // Domain controller hostname (extracted from LDAP_URL or specified separately)
  domainController: process.env.NTLM_DOMAIN_CONTROLLER || process.env.LDAP_URL || 'ldap://DC1.espandarco.com:389',
};

