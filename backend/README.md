# Espandar Authentication Backend

Backend API server for Active Directory authentication.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your Active Directory settings:
```bash
cp .env.example .env
```

Then edit `.env` with your AD configuration:
- `LDAP_URL` - Your domain controller LDAP URL
- `LDAP_BASE_DN` - Your domain base DN
- `JWT_SECRET` - A secure random string

### 3. Get Active Directory Settings

**You need to get these from your IT administrator:**

1. **LDAP Server URL**
   - Ask: "What's the LDAP server URL for our Active Directory?"
   - Example: `ldap://dc01.espandarco.com:389`

2. **Base DN**
   - Ask: "What's the base DN for our Active Directory domain?"
   - Example: `dc=espandarco,dc=com`

3. **Username Format**
   - Usually: `user@espandarco.com` (userPrincipalName)
   - Or: `username` (sAMAccountName)

### 4. Start Development Server
```bash
npm run dev
```

### 5. Test
```bash
# Health check
curl http://localhost:3000/health

# Test login (replace with real AD credentials)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user@espandarco.com","password":"password"}'
```

## Configuration

### Finding Your Active Directory Settings

#### Method 1: Ask IT Administrator
Ask your IT team:
- LDAP server address
- Base DN for your domain
- Username format (email vs username)

#### Method 2: Use Windows Tools
```powershell
# Find domain controller
Get-ADDomainController

# Find base DN
Get-ADDomain | Select-Object DistinguishedName
```

#### Method 3: Check Current Domain
```powershell
# Get current domain info
[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
```

## Production Deployment

1. Build TypeScript:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

3. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start dist/server.js --name espandar-api
pm2 save
pm2 startup
```

## Troubleshooting

### "Cannot connect to LDAP server"
- Check `LDAP_URL` is correct
- Verify server is accessible from your machine
- Check firewall rules
- Try using IP address instead of hostname

### "Invalid credentials" (but they're correct)
- Check username format (try email format: `user@domain.com`)
- Verify user account is not locked or disabled
- Check if user has password expiration issues

### "Connection timeout"
- Increase `LDAP_TIMEOUT` in `.env`
- Check network connectivity
- Verify LDAP port (389 or 636) is open

## API Endpoints

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/powerbi-token` - Get Power BI token (TODO)
- `GET /health` - Health check

