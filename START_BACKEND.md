# 🚀 Quick Start: Start Your Backend Server

## Step 1: Install Dependencies (First Time Only)

```bash
cd backend
npm install
```

This will install:
- Express (web server)
- LDAPjs (Active Directory client)
- JWT (token generation)
- TypeScript and development tools

---

## Step 2: Configure Active Directory

Edit `backend/.env` file and update these values:

```env
# Replace with your actual LDAP server
LDAP_URL=ldap://your-actual-server.espandarco.com:389

# Replace with your actual base DN
LDAP_BASE_DN=dc=espandarco,dc=com
```

**Need help finding these?** See `CONFIGURE_AD.md` for detailed instructions.

---

## Step 3: Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Espandar Authentication API
📍 Server running on: http://localhost:3000
📋 LDAP URL: ldap://your-server...
✅ Ready to accept authentication requests!
```

---

## Step 4: Test It Works

Open another terminal and test:

```bash
# Health check
curl http://localhost:3000/health

# Test login (replace with real AD credentials)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"user@espandarco.com\",\"password\":\"password\"}"
```

---

## Step 5: Start Frontend

In another terminal:

```bash
# Make sure .env exists in project root
# Create it if needed with:
# VITE_API_BASE_URL=http://localhost:3000/api
# VITE_USE_MOCK_AUTH=false

npm run dev
```

Go to http://localhost:5173/login and test!

---

## Troubleshooting

**"Cannot find module" errors?**
→ Run `npm install` in backend folder

**"Port 3000 already in use"?**
→ Change PORT in `.env` or stop the other service

**"Cannot connect to LDAP"?**
→ Check your LDAP_URL and LDAP_BASE_DN in `.env`

---

**That's it! Your backend is running and ready for Active Directory authentication!** ✅

