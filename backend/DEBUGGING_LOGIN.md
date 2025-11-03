# Debugging Login Issues - Logging Guide

## Overview

Detailed logging has been added to help diagnose why some users can't login while others can. All logs are output to the server console.

## How to Use the Logs

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

### 2. Attempt a Login

Have a user try to login. You'll see detailed logs in the console.

### 3. Look for Log Prefixes

- `[Auth Route]` - Request handling
- `[LDAP Auth]` - Authentication attempts
- `[LDAP Search]` - User search operations

## What the Logs Show

### Successful Login Flow

```
[Auth Route] Login request received
[Auth Route] Username: "user@espandarco.com"
[LDAP Auth] Authentication attempt started
[LDAP Auth] Using userPrincipalName format: "user@espandarco.com"
[LDAP Auth] ✅ LDAP bind SUCCESS
[LDAP Search] Starting user search
[LDAP Search] ✅ Search entry found
[LDAP Search] Attribute values:
  - displayName: "Full Name"
  - userPrincipalName: "user@espandarco.com"
  - sAMAccountName: "username"
[Auth Route] ✅ Authentication SUCCESS
```

### Failed Login - Common Scenarios

#### 1. **LDAP Bind Failed (Invalid Credentials)**
```
[LDAP Auth] ❌ LDAP bind FAILED
[LDAP Auth] Error code: 49
[LDAP Auth] Error message: Invalid Credentials
```
**Possible causes:**
- Wrong password
- Wrong username format
- Account locked/disabled
- UserPrincipalName not set in AD

**Solutions:**
- Verify password is correct
- Try username without @ (sAMAccountName)
- Check if account is disabled in AD
- Verify UserPrincipalName is set in AD

#### 2. **LDAP Search Failed (User Not Found)**
```
[LDAP Auth] ✅ LDAP bind SUCCESS
[LDAP Search] ⚠️ Search completed but NO user found
```
**Possible causes:**
- UserPrincipalName mismatch
- sAMAccountName mismatch
- User in different OU
- Search permissions issue

**Solutions:**
- Check what UserPrincipalName is set in AD
- Verify sAMAccountName matches
- Check if user is in the expected OU
- Verify LDAP search permissions

#### 3. **Connection Error**
```
[LDAP Auth] ❌ LDAP connection error
[LDAP Auth] Error message: Connection timeout
```
**Possible causes:**
- Network connectivity
- Firewall blocking port 389
- Domain controller unreachable
- DNS resolution issue

**Solutions:**
- Ping the domain controller: `ping DC0.espandarco.com`
- Check firewall rules
- Verify DNS resolution
- Try using DC1 instead of DC0

## Testing the Configuration

### Test Endpoint

Visit: `GET http://localhost:3000/api/auth/test-ldap`

This will show your current LDAP configuration.

### Test a User Login

1. Check what format works for your username:
   - Does it work with `@espandarco.com`?
   - Does it work without `@` (just the username)?

2. Compare with failing users:
   - What username format are they using?
   - Check the logs to see what's different

## Common Issues and Solutions

### Issue: "UserPrincipalName not set"

Some users might not have `userPrincipalName` set in AD. In this case:
1. The bind might succeed
2. But the search won't find the user
3. The user will still be authenticated but with basic info

**Solution:** Ask IT to set UserPrincipalName for all users, or use sAMAccountName format.

### Issue: "Username format mismatch"

Different users might have different formats:
- `firstname.lastname@espandarco.com`
- `firstname.lastname@ESPANDARCO.COM` (uppercase)
- Just `firstname.lastname` (no domain)

**Solution:** Try different formats and see which works.

### Issue: "Account disabled or locked"

**Check logs for:**
```
Error code: 49
Error name: InvalidCredentials
```

**Solution:** Check Active Directory to see if account is:
- Disabled
- Locked (too many failed attempts)
- Password expired

## Log Format Reference

Each log entry includes:
- **Timestamp**: ISO 8601 format
- **Prefix**: Module identifier
- **Status**: ✅ Success, ❌ Error, ⚠️ Warning
- **Details**: Relevant information

## Next Steps

1. **Collect logs** from a failing user login
2. **Compare** with a working user login
3. **Identify** the difference in the logs
4. **Apply fix** based on the issue found

## Getting Help

When asking for help, provide:
1. The full log output from a failed login attempt
2. The username format being used
3. Whether other users can login successfully
4. Any error codes shown in the logs

