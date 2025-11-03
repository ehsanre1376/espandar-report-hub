/**
 * Test Login Script
 * 
 * Tests the login endpoint with a username and password
 * Run with: npm run test:login -- <username> <password>
 */

import http from 'http';

const username = process.argv[2];
const password = process.argv[3];
const API_URL = process.argv[4] || 'http://localhost:3000';

if (!username || !password) {
  console.log('Usage: npm run test:login -- <username> <password> [api_url]');
  console.log('Example: npm run test:login -- user@espandarco.com password');
  console.log('Example: npm run test:login -- username password http://localhost:3000');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════');
console.log('🔍 Testing Login Endpoint');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log(`Username: ${username}`);
console.log(`Password: ${'*'.repeat(password.length)}`);
console.log(`API URL: ${API_URL}`);
console.log('');
console.log('📋 Make sure the backend server is running!');
console.log('   Run: npm run dev');
console.log('');
console.log('Testing login...');
console.log('');

const url = new URL(`${API_URL}/api/auth/login`);
const postData = JSON.stringify({
  username,
  password,
});

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('Making request to:', `${url.protocol}//${url.hostname}:${options.port}${url.pathname}`);
console.log('');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const responseData = JSON.parse(data);

    console.log(`Status Code: ${res.statusCode}`);
    console.log('');

    if (res.statusCode === 200 && responseData.success) {
      console.log('✅ LOGIN SUCCESS!');
      console.log('');
      console.log('User Details:');
      console.log(`   Username: ${responseData.user?.username}`);
      console.log(`   Display Name: ${responseData.user?.displayName}`);
      console.log(`   Email: ${responseData.user?.email}`);
      console.log(`   Groups: ${responseData.user?.groups?.join(', ') || 'None'}`);
      console.log(`   Token: ${responseData.token?.substring(0, 20)}...`);
      console.log('');
      console.log('✅ Authentication is working correctly!');
    } else {
      console.log('❌ LOGIN FAILED');
      console.log('');
      console.log('Error Details:');
      console.log(`   Error: ${responseData.error || 'Unknown error'}`);
      console.log(`   Success: ${responseData.success}`);
      console.log('');
      console.log('💡 Troubleshooting:');
      console.log('   1. Check the server console logs for detailed error information');
      console.log('   2. Verify the username format is correct');
      console.log('   3. Check if password is correct');
      console.log('   4. Verify LDAP connection is working');
      console.log('   5. Check if user account is enabled in AD');
      console.log('');
      console.log('Common issues:');
      console.log('   - Username format mismatch (try with/without @domain.com)');
      console.log('   - Wrong password');
      console.log('   - Account disabled or locked');
      console.log('   - UserPrincipalName not set in AD');
      console.log('');
      process.exit(1);
      }
    } catch (parseError) {
      console.log('❌ Failed to parse response');
      console.log('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error: any) => {
  console.log('❌ REQUEST ERROR');
  console.log('');
  console.log(`Error: ${error.message}`);
  console.log('');
  console.log('💡 Make sure:');
  console.log('   1. Backend server is running (npm run dev)');
  console.log('   2. Server is accessible at:', API_URL);
  console.log('   3. CORS is configured correctly');
  console.log('');
  process.exit(1);
});

req.write(postData);
req.end();

