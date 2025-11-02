# Environment Setup Instructions

## Step 1: Create `.env` File

Create a file named `.env` in the `backend/` folder with this content:

```env
# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=espandar-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=24h

# Active Directory / LDAP Configuration
# =====================================
# IMPORTANT: Replace these with your actual Active Directory settings!

# LDAP Server URL
# Get this from your IT administrator
# Common formats:
#   ldap://your-server.espandarco.com:389
#   ldaps://your-server.espandarco.com:636 (secure)
LDAP_URL=ldap://your-domain-controller.espandarco.com:389

# Base DN (Domain Name)
# Format: dc=espandarco,dc=com
# To find this:
#   1. Open Active Directory Users and Computers
#   2. Right-click your domain → Properties
#   3. Look for "Distinguished Name" or ask your IT admin
LDAP_BASE_DN=dc=espandarco,dc=com

# Optional: Service account for LDAP queries
# Only needed if your AD requires service account for queries
# Leave empty if not needed
LDAP_BIND_DN=
LDAP_BIND_PASSWORD=

# LDAP Timeout Settings (milliseconds)
LDAP_TIMEOUT=5000
LDAP_CONNECT_TIMEOUT=5000

# Environment
NODE_ENV=development
```

## Step 2: Update AD Settings

Replace these two values with your actual Active Directory settings:

1. **LDAP_URL** - Your domain controller address
2. **LDAP_BASE_DN** - Your domain distinguished name

See `CONFIGURE_AD.md` for detailed instructions on how to find these.

## Step 3: Save and Start

After creating `.env` file, you can start the server:

```bash
cd backend
npm install
npm run dev
```

