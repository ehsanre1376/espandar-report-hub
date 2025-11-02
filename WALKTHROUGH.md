# 🚶 Step-by-Step Walkthrough

Follow these steps **in order** to get Active Directory authentication working.

---

## ✅ STEP 1: Install Backend Dependencies

Open terminal in your project root:

```bash
cd backend
npm install
```

**Wait for:** All packages to install (might take 1-2 minutes)

**Expected:** No errors, packages installed successfully

---

## ✅ STEP 2: Create `.env` File in Backend

1. Go to `backend/` folder
2. Create a new file named `.env` (no extension, just `.env`)
3. Copy content from `backend/ENV_SETUP.md` into the file
4. **Update these two values:**
   - `LDAP_URL` - Replace with your actual LDAP server
   - `LDAP_BASE_DN` - Replace with your actual base DN

**Don't know these values?** See `CONFIGURE_AD.md` for how to find them.

---

## ✅ STEP 3: Get Your Active Directory Settings

You need to get these from your IT administrator or find them yourself:

### Option A: Ask IT Administrator
Ask them:
1. "What's the LDAP server URL for our Active Directory?"
2. "What's the base DN for our Active Directory domain?"
3. "Should users login with email format (user@espandarco.com) or username?"

### Option B: Find Yourself (Windows)
Open PowerShell (as Administrator):

```powershell
# Find domain controller
Get-ADDomainController | Select-Object Name, IPv4Address

# Find base DN
Get-ADDomain | Select-Object DistinguishedName
```

**Example output:**
- LDAP URL: `ldap://dc01.espandarco.com:389`
- Base DN: `DC=espandarco,DC=com` (convert to lowercase: `dc=espandarco,dc=com`)

---

## ✅ STEP 4: Update Backend `.env` File

Edit `backend/.env` file and replace:

```env
# Replace this:
LDAP_URL=ldap://your-domain-controller.espandarco.com:389
# With your actual server:
LDAP_URL=ldap://dc01.espandarco.com:389

# Replace this:
LDAP_BASE_DN=dc=espandarco,dc=com
# With your actual DN (keep lowercase):
LDAP_BASE_DN=dc=espandarco,dc=com
```

---

## ✅ STEP 5: Start Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 Espandar Authentication API
📍 Server running on: http://localhost:3000
📋 LDAP URL: ldap://your-server...
📋 LDAP Base DN: dc=espandarco,dc=com
✅ Ready to accept authentication requests!
```

**If you see errors:**
- "Cannot find module" → Run `npm install` again
- "Port already in use" → Change PORT in `.env` or stop other service
- "LDAP connection error" → Check LDAP_URL and network connectivity

---

## ✅ STEP 6: Test Backend (Optional)

Open another terminal:

```bash
# Test health endpoint
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "ldapConfigured": true
}
```

---

## ✅ STEP 7: Configure Frontend

1. Create `.env` file in project root (same level as `package.json`)
2. Add:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_AUTH=false
```

---

## ✅ STEP 8: Start Frontend

```bash
# In project root (not in backend folder)
npm run dev
```

---

## ✅ STEP 9: Test Login

1. Go to `http://localhost:5173/login`
2. Enter a real AD user's credentials:
   - Username: `user@espandarco.com` (or just `username`)
   - Password: Their AD password
3. Click "Sign In"
4. **Should authenticate and redirect to dashboard!**

---

## ✅ STEP 10: Deploy to Production

Once testing works:

1. **Backend deployment:**
   - Build: `cd backend && npm run build`
   - Deploy to Windows Server or Linux
   - Update `.env` with production values
   - Use PM2 or Windows Service to run continuously

2. **Frontend deployment:**
   - Build: `npm run build`
   - Deploy to Vercel/Netlify/your server
   - Update `.env` with production API URL

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

---

## 🔍 Troubleshooting

### Backend won't start
- ✅ Check all dependencies installed: `npm install`
- ✅ Check `.env` file exists in `backend/` folder
- ✅ Check TypeScript compiles: `npm run build` (check for errors)

### "Cannot connect to LDAP"
- ✅ Verify `LDAP_URL` is correct (ask IT)
- ✅ Test network: `ping your-server-name`
- ✅ Check firewall allows port 389
- ✅ Try using IP address instead of hostname

### "Invalid credentials" (but they're correct)
- ✅ Try email format: `user@espandarco.com`
- ✅ Try username format: `username`
- ✅ Check user account is not locked in AD
- ✅ Verify password hasn't expired

### Frontend can't connect to backend
- ✅ Check backend is running (http://localhost:3000/health)
- ✅ Check `VITE_API_BASE_URL` in frontend `.env`
- ✅ Check CORS settings in backend (FRONTEND_URL)
- ✅ Check browser console for errors

---

## 📋 Checklist

Before testing, make sure:

- [ ] Backend dependencies installed (`npm install` in backend/)
- [ ] `.env` file created in `backend/` folder
- [ ] LDAP_URL updated in `backend/.env`
- [ ] LDAP_BASE_DN updated in `backend/.env`
- [ ] Backend server starts without errors
- [ ] Health endpoint works (http://localhost:3000/health)
- [ ] Frontend `.env` created in project root
- [ ] VITE_API_BASE_URL set correctly
- [ ] Frontend starts without errors
- [ ] Can access login page

---

## 🎯 Next Steps After Setup Works

1. **Test with multiple users** - Make sure different AD users can login
2. **Configure Power BI** - Add Power BI token generation (optional)
3. **Deploy to production** - See DEPLOYMENT_GUIDE.md
4. **Add security** - Enable HTTPS, rate limiting, etc.
5. **Add monitoring** - Set up logging and error tracking

---

**Need help with a specific step? Check `CONFIGURE_AD.md` for AD configuration help!**

