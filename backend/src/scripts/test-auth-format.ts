/**
 * Test different username formats for authentication
 * This helps identify the correct username format
 */

import { ADService } from '../services/adService';

const username = process.argv[2];

if (!username) {
  console.log('Usage: npm run test:auth:format <username>');
  console.log('Example: npm run test:auth:format username');
  console.log('');
  console.log('Note: This will test authentication formats but needs a password.');
  console.log('      Better to test through the login API endpoint.');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════');
console.log('🔍 Username Format Analysis');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log(`Input username: "${username}"`);
console.log('');

const adService = new ADService();
const domain = 'espandarco.com';

// Show what formats will be tried
console.log('📋 Authentication will try these formats:');
console.log('');

if (username.includes('@')) {
  console.log(`1. userPrincipalName: "${username}" (as provided)`);
  console.log(`2. The system will try binding with: "${username}"`);
} else {
  const userPrincipalName = `${username}@${domain}`;
  console.log(`1. sAMAccountName: "${username}"`);
  console.log(`2. Constructed userPrincipalName: "${userPrincipalName}"`);
  console.log(`3. The system will try binding with: "${userPrincipalName}"`);
}

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('💡 What to check:');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('1. Try login with:');
console.log(`   - ${username.includes('@') ? username : `${username}@${domain}`}`);
console.log(`   - ${username} (without @)`);
console.log('');
console.log('2. Check AD for the exact format:');
console.log('   - UserPrincipalName attribute');
console.log('   - sAMAccountName attribute');
console.log('');
console.log('3. Common issues:');
console.log('   - Username format might differ from AD (e.g., "first.last" vs "flast")');
console.log('   - UserPrincipalName might be different');
console.log('   - Account might be disabled');
console.log('');
console.log('4. Test through login API to see detailed logs:');
console.log('   - Start server: npm run dev');
console.log('   - Try login and check logs for exact error');
console.log('');

