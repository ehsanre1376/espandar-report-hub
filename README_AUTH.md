# Authentication Setup Guide

## Overview
This application uses Active Directory authentication and integrates with Power BI for SSO.

## Backend API Requirements

You need to create a backend API that handles Active Directory authentication. The API should have the following endpoints:

### 1. POST `/api/auth/login`
Authenticates a user against Active Directory.

**Request Body:**
```json
{
  "username": "user@domain.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "username": "user@domain.com",
    "displayName": "John Doe",
    "email": "user@domain.com",
    "groups": ["group1", "group2"]
  },
  "powerBiToken": "power-bi-access-token"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

### 2. POST `/api/auth/logout`
Logs out the user.

**Headers:**
```
Authorization: Bearer <token>
```

### 3. POST `/api/auth/verify`
Verifies if a token is still valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "valid": true
}
```

### 4. GET `/api/auth/powerbi-token`
Gets a Power BI access token for SSO.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "token": "power-bi-access-token"
}
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Or set it in your deployment environment.

## Backend Implementation (Example - Node.js/Express)

### Using Active Directory (LDAP)

You'll need to use a library like `ldapjs` or `activedirectory`:

```javascript
// Example using activedirectory package
const ActiveDirectory = require('activedirectory');

const config = {
  url: 'ldap://your-domain-controller:389',
  baseDN: 'dc=domain,dc=com',
  username: 'service-account@domain.com',
  password: 'service-password'
};

const ad = new ActiveDirectory(config);

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await authenticateUser(username, password);
    const token = generateJWT(user);
    const powerBiToken = await getPowerBiToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        groups: user.groups
      },
      powerBiToken
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});
```

## Power BI Authentication

For Power BI SSO, you'll need to:

1. Register your application in Azure AD
2. Grant Power BI permissions
3. Use Azure AD to get access tokens for Power BI

Example using `@azure/msal-node`:

```javascript
const { ConfidentialClientApplication } = require('@azure/msal-node');

const msalConfig = {
  auth: {
    clientId: 'your-client-id',
    authority: 'https://login.microsoftonline.com/your-tenant-id',
    clientSecret: 'your-client-secret'
  }
};

const pca = new ConfidentialClientApplication(msalConfig);

async function getPowerBiToken(user) {
  const tokenRequest = {
    scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    username: user.username
  };
  
  const response = await pca.acquireTokenByUsernamePassword(tokenRequest);
  return response.accessToken;
}
```

## Security Notes

1. Always use HTTPS in production
2. Store credentials securely (use environment variables)
3. Implement token expiration and refresh
4. Validate all inputs
5. Use secure session management
6. Implement rate limiting on login endpoints

