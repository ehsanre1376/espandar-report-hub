# Quick Start Guide - 5 Minutes

## Fastest Way to Get Active Directory Authentication Working

### Step 1: Create Backend (2 minutes)
```bash
# Create backend folder
mkdir backend
cd backend
npm init -y

# Install packages
npm install express cors dotenv jsonwebtoken ldapjs
npm install --save-dev typescript ts-node nodemon @types/node @types/express

# Copy the backend files from DEPLOYMENT_GUIDE.md
```

### Step 2: Configure LDAP (1 minute)
Create `backend/.env`:
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=change-this-in-production
LDAP_URL=ldap://your-domain-controller.espandarco.com:389
LDAP_BASE_DN=dc=espandarco,dc=com
```

### Step 3: Update Frontend (30 seconds)
Create `.env` in project root:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_AUTH=false
```

### Step 4: Start Servers (1 minute)
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### Step 5: Test (30 seconds)
1. Go to http://localhost:5173/login
2. Login with: `user@espandarco.com` / `password`
3. Should authenticate with Active Directory!

---

**Need the full backend code? See DEPLOYMENT_GUIDE.md** 📚

