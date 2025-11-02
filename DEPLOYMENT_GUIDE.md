# Complete Deployment Guide - Active Directory Authentication

## Overview
This guide will help you deploy your application with real Active Directory authentication so users can login with their AD credentials.

## Prerequisites
- Windows Server with Active Directory access
- Node.js installed (for backend API)
- Access to your AD domain controller
- Network access between your application and AD server

---

## Step 1: Create Backend API Server

### 1.1 Create Backend Folder
```bash
# In your project root or separate directory
mkdir backend
cd backend
npm init -y
```

### 1.2 Install Required Packages
```bash
npm install express cors dotenv jsonwebtoken ldapjs
npm install --save-dev @types/node @types/express typescript ts-node nodemon
```

### 1.3 Create Backend Structure
```
backend/
├── src/
│   ├── server.ts          # Main server file
│   ├── routes/
│   │   └── auth.ts        # Authentication routes
│   ├── services/
│   │   ├── adService.ts  # Active Directory service
│   │   └── jwtService.ts  # JWT token service
│   └── config/
│       └── ldap.config.ts # LDAP configuration
├── .env                   # Environment variables
├── tsconfig.json
└── package.json
```

---

## Step 2: Implement Active Directory Authentication

### 2.1 Create `backend/src/config/ldap.config.ts`
```typescript
export const ldapConfig = {
  url: process.env.LDAP_URL || 'ldap://your-domain-controller:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=espandarco,dc=com',
  // Service account for LDAP queries (optional, depends on setup)
  bindDN: process.env.LDAP_BIND_DN || '',
  bindPassword: process.env.LDAP_BIND_PASSWORD || '',
};
```

### 2.2 Create `backend/src/services/adService.ts`
```typescript
import ldap from 'ldapjs';
import { ldapConfig } from '../config/ldap.config';

export interface ADUser {
  username: string;
  displayName: string;
  email: string;
  groups?: string[];
}

export class ADService {
  private client: ldap.Client;

  constructor() {
    this.client = ldap.createClient({
      url: ldapConfig.url,
      reconnect: true,
    });
  }

  /**
   * Authenticate user against Active Directory
   */
  async authenticate(username: string, password: string): Promise<ADUser | null> {
    return new Promise((resolve, reject) => {
      // Format username for LDAP (can be userPrincipalName or sAMAccountName)
      const userDN = this.formatUserDN(username);

      // Try to bind (authenticate) with user credentials
      this.client.bind(userDN, password, (err) => {
        if (err) {
          // Authentication failed
          resolve(null);
          return;
        }

        // Authentication successful, get user details
        this.getUserInfo(username, (userInfo) => {
          // Unbind to close connection
          this.client.unbind();
          
          if (userInfo) {
            resolve(userInfo);
          } else {
            resolve(null);
          }
        });
      });
    });
  }

  /**
   * Format username for LDAP DN
   */
  private formatUserDN(username: string): string {
    // Try userPrincipalName format first
    if (username.includes('@')) {
      return username;
    }
    
    // Try sAMAccountName format
    return `${username}@${ldapConfig.baseDN.replace(/dc=/g, '').replace(/,/g, '.')}`;
  }

  /**
   * Get user information from AD
   */
  private getUserInfo(username: string, callback: (user: ADUser | null) => void): void {
    // Extract username part (before @)
    const usernamePart = username.split('@')[0];
    
    const searchDN = ldapConfig.baseDN;
    const filter = `(&(objectClass=user)(|(userPrincipalName=${username})(sAMAccountName=${usernamePart})))`;
    
    const opts: ldap.SearchOptions = {
      filter: filter,
      scope: 'sub',
      attributes: ['displayName', 'mail', 'memberOf', 'userPrincipalName', 'sAMAccountName'],
    };

    this.client.search(searchDN, opts, (err, res) => {
      if (err) {
        callback(null);
        return;
      }

      let userFound = false;

      res.on('searchEntry', (entry) => {
        userFound = true;
        
        const displayName = entry.pojo.attributes.find(attr => attr.type === 'displayName')?.values[0] || username;
        const email = entry.pojo.attributes.find(attr => attr.type === 'mail')?.values[0] || username;
        const memberOf = entry.pojo.attributes.find(attr => attr.type === 'memberOf')?.values || [];
        
        // Extract group names
        const groups = memberOf.map((group: string) => {
          const match = group.match(/CN=([^,]+)/);
          return match ? match[1] : '';
        }).filter(Boolean);

        callback({
          username,
          displayName,
          email,
          groups,
        });
      });

      res.on('error', () => {
        callback(null);
      });

      res.on('end', () => {
        if (!userFound) {
          callback(null);
        }
      });
    });
  }
}
```

### 2.3 Create `backend/src/services/jwtService.ts`
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export function generateToken(user: { username: string; email: string }): string {
  return jwt.sign(
    {
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
```

### 2.4 Create `backend/src/routes/auth.ts`
```typescript
import { Router } from 'express';
import { ADService } from '../services/adService';
import { generateToken, verifyToken } from '../services/jwtService';

const router = Router();
const adService = new ADService();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Authenticate against Active Directory
    const user = await adService.authenticate(username, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // In production, you might also get Power BI token here
    // For now, we'll return success without Power BI token
    // You'll need to implement Power BI authentication separately

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        groups: user.groups || [],
      },
      // powerBiToken: await getPowerBiToken(user), // Implement this later
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ valid: false });
    }

    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  // In a stateless JWT system, logout is typically handled client-side
  // by removing the token. You might want to maintain a blacklist.
  res.json({ success: true });
});

export default router;
```

### 2.5 Create `backend/src/server.ts`
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📋 LDAP URL: ${process.env.LDAP_URL || 'Not configured'}`);
});
```

---

## Step 3: Configure Environment Variables

### 3.1 Create `backend/.env`
```env
# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Active Directory / LDAP
LDAP_URL=ldap://your-domain-controller.espandarco.com:389
LDAP_BASE_DN=dc=espandarco,dc=com

# Optional: Service account for LDAP queries
# LDAP_BIND_DN=CN=ServiceAccount,OU=ServiceAccounts,DC=espandarco,DC=com
# LDAP_BIND_PASSWORD=service-account-password
```

### 3.2 Update Frontend `.env`
Create or update `.env` in your frontend root:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_AUTH=false
```

---

## Step 4: Configure Active Directory

### 4.1 Find Your LDAP Settings
1. **LDAP URL**: 
   - Format: `ldap://your-domain-controller.domain.com:389`
   - Or: `ldaps://your-domain-controller.domain.com:636` (for SSL)
   - Find your domain controller name

2. **Base DN**:
   - Format: `dc=espandarco,dc=com`
   - Find this using: `dsquery server` or ask your AD administrator

3. **User Format**:
   - Usually `userPrincipalName`: `user@espandarco.com`
   - Or `sAMAccountName`: `username`

### 4.2 Test LDAP Connection
```bash
# On Windows, test with:
ldp.exe
# Connect to your LDAP server
```

---

## Step 5: Update TypeScript Configuration

### 5.1 Create `backend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 5.2 Update `backend/package.json` Scripts
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "echo \"No tests specified\" && exit 0"
  }
}
```

---

## Step 6: Test Locally

### 6.1 Start Backend Server
```bash
cd backend
npm run dev
```

### 6.2 Start Frontend
```bash
# In project root
npm run dev
```

### 6.3 Test Login
1. Go to `http://localhost:5173/login`
2. Enter AD credentials:
   - Username: `user@espandarco.com` or `username`
   - Password: User's AD password
3. Click "Sign In"
4. Should authenticate and redirect to dashboard

---

## Step 7: Deployment Options

### Option A: Deploy on Windows Server (Recommended for AD)

#### 7.1 Install Node.js on Windows Server
1. Download Node.js LTS from nodejs.org
2. Install it on your Windows server
3. Verify: `node --version`

#### 7.2 Set Up Application as Windows Service
```bash
# Install PM2 or use NSSM (Non-Sucking Service Manager)
npm install -g pm2
pm2 startup
pm2 start dist/server.js --name "espandar-api"
pm2 save
```

Or use **NSSM**:
1. Download NSSM from nssm.cc
2. Install as service:
```cmd
nssm install EspandarAPI
nssm set EspandarAPI Application "C:\Program Files\nodejs\node.exe"
nssm set EspandarAPI AppParameters "C:\path\to\your\backend\dist\server.js"
nssm start EspandarAPI
```

#### 7.3 Configure Firewall
```powershell
# Allow port 3000 (or your port)
New-NetFirewallRule -DisplayName "Espandar API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Option B: Deploy on Linux Server

#### 7.1 Set Up Server
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Build backend
cd backend
npm run build

# Start with PM2
pm2 start dist/server.js --name "espandar-api"
pm2 startup
pm2 save
```

### Option C: Deploy Frontend (Vercel/Netlify)

#### 7.1 Build Frontend
```bash
npm run build
```

#### 7.2 Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

#### 7.3 Update Environment Variables
- In Vercel dashboard, add:
  - `VITE_API_BASE_URL=https://your-backend-api.com/api`
  - `VITE_USE_MOCK_AUTH=false`

---

## Step 8: Production Configuration

### 8.1 Security Checklist
- [ ] Change JWT_SECRET to a strong random string
- [ ] Use HTTPS for both frontend and backend
- [ ] Configure CORS properly (limit to your domain)
- [ ] Set secure cookie flags
- [ ] Use environment variables for all secrets
- [ ] Enable LDAPS (secure LDAP) if possible
- [ ] Set up rate limiting on login endpoint
- [ ] Add logging and monitoring

### 8.2 Update Backend `.env` (Production)
```env
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=generate-a-strong-random-secret-here
JWT_EXPIRES_IN=8h

# Use LDAPS (secure) if available
LDAP_URL=ldaps://your-domain-controller.espandarco.com:636
LDAP_BASE_DN=dc=espandarco,dc=com
```

### 8.3 Update Frontend `.env` (Production)
```env
VITE_API_BASE_URL=https://your-backend-api.com/api
VITE_USE_MOCK_AUTH=false
```

---

## Step 9: Troubleshooting

### Common Issues

#### 1. "Cannot connect to LDAP server"
- Check LDAP_URL is correct
- Verify network connectivity to domain controller
- Check firewall rules
- Try using IP address instead of hostname

#### 2. "Invalid credentials" for valid users
- Check username format (userPrincipalName vs sAMAccountName)
- Verify Base DN is correct
- Check if user account is locked or disabled in AD

#### 3. "CORS errors"
- Update FRONTEND_URL in backend .env
- Check CORS configuration in server.ts

#### 4. Backend not accessible
- Check firewall rules
- Verify server is running: `pm2 list`
- Check logs: `pm2 logs espandar-api`

---

## Step 10: Testing Checklist

- [ ] Backend starts without errors
- [ ] Can connect to LDAP server
- [ ] Login with valid AD user works
- [ ] Login with invalid credentials fails
- [ ] JWT token is generated and returned
- [ ] Frontend receives token and stores it
- [ ] Protected routes work after login
- [ ] Logout clears session
- [ ] Multiple users can login simultaneously

---

## Next Steps

1. **Power BI Integration**: Implement Power BI token generation (see README_AUTH.md)
2. **User Groups**: Use AD groups for role-based access control
3. **Password Policies**: Respect AD password policies
4. **Session Management**: Implement token refresh
5. **Monitoring**: Add logging and error tracking

---

## Need Help?

If you encounter issues:
1. Check backend logs
2. Test LDAP connection directly
3. Verify AD user has correct format
4. Check network connectivity
5. Review firewall rules

---

**You're all set! Your users can now login with their Active Directory credentials.** 🎉

