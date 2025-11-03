# Step-by-Step: Deploy Active Directory Login

## ✅ What You Need to Know First

**Question**: How do other users login?
**Answer**: Once you set up the backend API with Active Directory, ANY user in your AD domain can login with their AD username and password.

**Question**: Does it fetch from Active Directory?
**Answer**: Yes! The backend will check each username/password against your Active Directory in real-time.

---

## 🚀 Quick Setup (30 Minutes)

### STEP 1: Get Your Active Directory Information (5 min)

You need these 3 things from your IT/AD administrator:

1. **LDAP Server Address**
   - Format: `ldap://your-server.espandarco.com:389`
   - Or: `ldaps://your-server.espandarco.com:636` (secure)
   - Ask: "What's the LDAP server URL for our Active Directory?"

2. **Base DN (Domain Name)**
   - Format: `dc=espandarco,dc=com`
   - Find it: Right-click on your domain in Active Directory Users and Computers → Properties
   - Or ask: "What's the base DN for our AD domain?"

3. **Username Format**
   - Usually: `user@espandarco.com` (userPrincipalName)
   - Or: just `username` (sAMAccountName)
   - Ask: "What format should we use for login - email format or username?"

### STEP 2: Create Backend Folder (2 min)

```bash
# In your project root
mkdir backend
cd backend
npm init -y
```

### STEP 3: Install Packages (2 min)

```bash
npm install express cors dotenv jsonwebtoken ldapjs
npm install --save-dev typescript ts-node nodemon @types/node @types/express @types/cors @types/jsonwebtoken @types/ldapjs
```

### STEP 4: Create Backend Files (10 min)

Create the files from DEPLOYMENT_GUIDE.md or use the template below.

### STEP 5: Configure Environment (2 min)

Create `backend/.env`:
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-random-secret-key-change-this
LDAP_URL=ldap://YOUR-SERVER.espandarco.com:389
LDAP_BASE_DN=dc=espandarco,dc=com
```

### STEP 6: Update Frontend Config (1 min)

Create `.env` in project root:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_AUTH=false
```

### STEP 7: Test Locally (5 min)

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend  
npm run dev
```

Go to http://localhost:5173/login and test with real AD credentials!

### STEP 8: Deploy (See DEPLOYMENT_GUIDE.md)

---

## 📋 Complete File List

You need to create these files in `backend/`:

1. ✅ `package.json` (already created above)
2. ✅ `tsconfig.json`
3. ✅ `.env`
4. ✅ `src/server.ts`
5. ✅ `src/routes/auth.ts`
6. ✅ `src/services/adService.ts`
7. ✅ `src/services/jwtService.ts`
8. ✅ `src/config/ldap.config.ts`

---

## 🔧 Testing Checklist

Before deploying, test:

- [ ] Backend starts: `cd backend && npm run dev`
- [ ] Can access: http://localhost:3000/health
- [ ] Login works with AD user
- [ ] Invalid credentials are rejected
- [ ] Token is returned
- [ ] Frontend can login
- [ ] Multiple users can login

---

## 🎯 What Happens When a User Logs In?

1. User enters `username@espandarco.com` and `password`
2. Frontend sends to: `POST http://localhost:3000/api/auth/login`
3. Backend connects to your LDAP/AD server
4. Backend checks if username/password is correct
5. If correct:
   - Backend gets user info from AD (name, email, groups)
   - Backend creates JWT token
   - Returns token + user info to frontend
6. Frontend stores token and logs user in
7. User can now access protected pages

---

## 🔒 Security Notes

- ✅ Never commit `.env` files to git
- ✅ Use strong JWT_SECRET in production
- ✅ Use HTTPS in production
- ✅ Limit CORS to your domain
- ✅ Consider rate limiting on login

---

## ❓ Troubleshooting

**"Cannot connect to LDAP"**
→ Check LDAP_URL, verify server is accessible

**"Invalid credentials" (but they're correct)**
→ Check username format (try email vs username)

**"CORS error"**
→ Update FRONTEND_URL in backend .env

---

**See DEPLOYMENT_GUIDE.md for complete code examples!**

