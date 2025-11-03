# Setup Guide - Espandar Report Hub

## Current Status ✅

Your login page is working with **mock authentication**! You can test it right now with:
- **Username**: `user@espandarco.com` (configure mock credentials in `src/services/authService.ts`)
- **Password**: (configure mock password in `src/services/authService.ts`)

## What You Can Do Now

### 1. Test the Login (Working Now!)
1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to the login page (should redirect automatically)
3. Login with your Active Directory credentials:
   - Username: `your-username@espandarco.com` or just `your-username`
   - Password: Your AD password
4. You should be redirected to the dashboard!

### 2. Test the Application Features
- ✅ Browse categories and reports
- ✅ View Power BI reports (mock authentication)
- ✅ Use F11 for fullscreen mode
- ✅ Navigate using breadcrumbs
- ✅ Toggle sidebar menu

## Next Steps: Connect to Real Active Directory

To connect to your **real Active Directory** and **Power BI**, you need to:

### Step 1: Create Backend API Server

You need a backend server (Node.js, .NET, Python, etc.) that:
- Authenticates against Active Directory
- Returns JWT tokens
- Provides Power BI access tokens

**Recommended: Node.js with Express**

1. Create a new folder for your backend:
   ```bash
   mkdir backend
   cd backend
   ```

2. Initialize Node.js project:
   ```bash
   npm init -y
   ```

3. Install dependencies:
   ```bash
   npm install express cors dotenv jsonwebtoken
   npm install ldapjs  # For Active Directory
   npm install @azure/msal-node  # For Power BI
   ```

### Step 2: Configure Environment Variables

Create a `.env` file in your frontend root:
```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:3000/api

# Disable mock auth (use real backend)
VITE_USE_MOCK_AUTH=false
```

### Step 3: Backend API Implementation

Your backend needs 4 endpoints (see `README_AUTH.md` for details):

1. **POST `/api/auth/login`** - Authenticate against AD
2. **POST `/api/auth/logout`** - Logout user
3. **POST `/api/auth/verify`** - Verify token
4. **GET `/api/auth/powerbi-token`** - Get Power BI token

### Step 4: Active Directory Configuration

In your backend, you'll need:

**AD Connection Settings:**
- LDAP server URL (e.g., `ldap://your-domain-controller:389`)
- Base DN (e.g., `dc=espandarco,dc=com`)
- Service account credentials for AD queries

**Power BI Settings:**
- Azure AD Application ID
- Tenant ID
- Client Secret
- Power BI API permissions

### Quick Start: Backend Example (Node.js)

Here's a minimal example to get you started:

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const { authenticateAD } = require('./ad-auth');
const { getPowerBiToken } = require('./powerbi-auth');

const app = express();
app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Authenticate against Active Directory
    const user = await authenticateAD(username, password);
    
    if (user) {
      // Generate JWT token
      const token = generateJWT(user);
      
      // Get Power BI token
      const powerBiToken = await getPowerBiToken(username);
      
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
    } else {
      res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Backend API running on http://localhost:3000');
});
```

## Configuration Checklist

### Frontend (Already Done ✅)
- [x] Login page created
- [x] Authentication context
- [x] Protected routes
- [x] Mock authentication (for testing)

### Backend (To Do)
- [ ] Create backend server
- [ ] Install AD authentication library
- [ ] Configure AD connection
- [ ] Install Power BI authentication library
- [ ] Configure Azure AD app registration
- [ ] Implement login endpoint
- [ ] Implement token endpoints
- [ ] Test authentication flow

### Environment Variables Needed

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_AUTH=false
```

**Backend (.env):**
```env
AD_SERVER=ldap://your-domain-controller:389
AD_BASE_DN=dc=espandarco,dc=com
AD_USER=service-account@espandarco.com
AD_PASSWORD=service-password

AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
POWER_BI_SCOPE=https://analysis.windows.net/powerbi/api/.default
```

## Testing Flow

### Phase 1: Current (Mock Auth) ✅
1. Login with mock credentials
2. Test all frontend features
3. Verify UI/UX works correctly

### Phase 2: Backend Integration
1. Set up backend server
2. Configure AD connection
3. Test login endpoint
4. Update frontend to use real API
5. Test full authentication flow

### Phase 3: Power BI Integration
1. Configure Azure AD app
2. Test Power BI token retrieval
3. Verify Power BI SSO in reports

## Need Help?

1. **For Active Directory**: See `README_AUTH.md` for AD authentication examples
2. **For Power BI**: See Azure AD authentication documentation
3. **For Backend Setup**: Choose your preferred backend framework (Node.js, .NET, Python, etc.)

## Current Mock Mode

Right now, the app is in **development mode** with mock authentication. This allows you to:
- Test all features without a backend
- Develop and iterate quickly
- Verify the UI works correctly

When you're ready to connect to real AD, just:
1. Set up your backend API
2. Update environment variables
3. The frontend will automatically switch to real authentication

---

**You're all set to test the login now!** 🚀

