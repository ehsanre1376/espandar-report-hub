# Active Directory Configuration Guide

## Step-by-Step: Configure Your AD Settings

### Step 1: Get Your Active Directory Information

You need these 3 pieces of information:

#### 1. LDAP Server URL
**What to ask your IT administrator:**
> "What's the LDAP server URL or domain controller address for our Active Directory?"

**Common formats:**
- `ldap://dc01.espandarco.com:389`
- `ldaps://dc01.espandarco.com:636` (secure/SSL)
- Or just the hostname: `dc01.espandarco.com`

**How to find it yourself (Windows):**
```powershell
# Open PowerShell and run:
Get-ADDomainController

# Or check current domain:
[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain().DomainControllers[0].Name
```

#### 2. Base DN (Domain Name)
**What to ask your IT administrator:**
> "What's the base DN (Distinguished Name) for our Active Directory domain?"

**Common formats:**
- `dc=espandarco,dc=com`
- `dc=company,dc=local`
- `ou=Users,dc=company,dc=com` (if you have a specific OU)

**How to find it yourself:**
1. Open **Active Directory Users and Computers**
2. Right-click on your **domain** (top-level)
3. Click **Properties**
4. Look for **"Distinguished Name"**
5. Or use PowerShell:
```powershell
Get-ADDomain | Select-Object DistinguishedName
```

#### 3. Username Format
**Common formats:**
- `user@espandarco.com` (userPrincipalName) - **Most common**
- `username` (sAMAccountName)
- `DOMAIN\username` (domain\username format)

**How to test:**
Try logging in with:
1. `your-email@espandarco.com` format
2. If that doesn't work, try just `your-username`

---

### Step 2: Configure Backend `.env` File

1. **Open** `backend/.env` file

2. **Update these values:**

```env
# Replace with your actual LDAP server
LDAP_URL=ldap://your-actual-server.espandarco.com:389

# Replace with your actual base DN
LDAP_BASE_DN=dc=espandarco,dc=com

# Generate a strong secret (keep this secret!)
JWT_SECRET=your-super-secret-key-here
```

3. **Save the file**

---

### Step 3: Test Your Configuration

#### 3.1 Start the Backend
```bash
cd backend
npm install  # First time only
npm run dev
```

You should see:
```
✅ Ready to accept authentication requests!
📍 Server running on: http://localhost:3000
📋 LDAP URL: ldap://your-server...
📋 LDAP Base DN: dc=espandarco,dc=com
```

#### 3.2 Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "ldapConfigured": true
}
```

#### 3.3 Test Login (Optional - Use Postman or curl)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@espandarco.com","password":"password"}'
```

**Expected responses:**

✅ **Success (200):**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "username": "test@espandarco.com",
    "displayName": "Test User",
    "email": "test@espandarco.com"
  }
}
```

❌ **Invalid credentials (401):**
```json
{
  "success": false,
  "error": "Invalid credentials..."
}
```

❌ **Connection error:**
- Check `LDAP_URL` is correct
- Verify server is accessible

---

### Step 4: Update Frontend Configuration

1. **Create `.env` file** in project root (if not exists)

2. **Add:**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_AUTH=false
```

3. **Restart frontend:**
```bash
npm run dev
```

---

### Step 5: Test with Real Users

1. Go to `http://localhost:5173/login`

2. Try logging in with a real AD user:
   - Username: `user@espandarco.com`
   - Password: Their AD password

3. Should authenticate and redirect to dashboard!

---

## Common Issues & Solutions

### Issue 1: "Cannot connect to LDAP server"

**Solutions:**
- ✅ Verify `LDAP_URL` is correct (check with IT)
- ✅ Test network connectivity: `ping your-domain-controller`
- ✅ Check firewall allows port 389 (or 636 for LDAPS)
- ✅ Try using IP address instead of hostname
- ✅ Verify server is accessible from your machine

### Issue 2: "Invalid credentials" (but they're correct)

**Solutions:**
- ✅ Try email format: `user@espandarco.com`
- ✅ Try username format: `username` (without @domain)
- ✅ Check if user account is locked/disabled in AD
- ✅ Verify user has correct password (try logging into Windows)
- ✅ Check if password has expired
- ✅ Verify username format matches your AD setup

### Issue 3: "Connection timeout"

**Solutions:**
- ✅ Increase timeout in `.env`: `LDAP_TIMEOUT=10000`
- ✅ Check network connectivity
- ✅ Verify LDAP port is open (389 or 636)
- ✅ Try using IP address instead of hostname
- ✅ Check if server requires LDAPS (port 636) instead of LDAP (port 389)

### Issue 4: "Base DN not found"

**Solutions:**
- ✅ Verify `LDAP_BASE_DN` format is correct
- ✅ Check with IT admin for correct base DN
- ✅ Try using PowerShell command above to get DN

---

## Security Checklist

Before going to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use `ldaps://` (secure LDAP) instead of `ldap://` if possible
- [ ] Use HTTPS for backend API
- [ ] Configure proper CORS (limit to your domain)
- [ ] Set up rate limiting on login endpoint
- [ ] Add logging and monitoring
- [ ] Use environment-specific `.env` files
- [ ] Never commit `.env` files to git

---

## Need Help?

If you're stuck:

1. **Check backend logs** - Look for error messages
2. **Test LDAP connection** - Use `ldp.exe` on Windows
3. **Ask IT team** - They can verify AD settings
4. **Check network** - Ensure you can reach AD server
5. **Try simpler config** - Start with basic settings, add complexity later

---

## Quick Reference

**Your AD settings checklist:**
- [ ] LDAP URL: `ldap://_____`
- [ ] Base DN: `dc=_____,dc=____`
- [ ] Username format: `email@domain.com` or `username`
- [ ] JWT Secret: Generated
- [ ] Backend running: ✅
- [ ] Frontend configured: ✅
- [ ] Test login works: ✅

---

**You're ready when all boxes are checked!** ✅

