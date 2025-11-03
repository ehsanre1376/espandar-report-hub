import { Router, Request, Response } from 'express';
import { ADService } from '../services/adService';
import { generateToken, verifyToken } from '../services/jwtService';

const router = Router();
const adService = new ADService();

/**
 * POST /api/auth/login
 * Authenticate user against Active Directory
 */
router.post('/login', async (req: Request, res: Response) => {
  const requestId = Date.now().toString(36);
  const logPrefix = `[Auth Route] [${requestId}] [${new Date().toISOString()}]`;
  
  try {
    const { username, password } = req.body;

    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} Login request received`);
    console.log(`${logPrefix} IP: ${req.ip || req.socket.remoteAddress}`);
    console.log(`${logPrefix} User-Agent: ${req.get('user-agent') || 'N/A'}`);

    // Validate input
    if (!username || !password) {
      console.log(`${logPrefix} ❌ Missing credentials`);
      console.log(`${logPrefix} Username provided: ${!!username}`);
      console.log(`${logPrefix} Password provided: ${!!password}`);
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Log username format (without password for security)
    const usernameLength = username.length;
    const hasAtSymbol = username.includes('@');
    console.log(`${logPrefix} Username length: ${usernameLength}`);
    console.log(`${logPrefix} Username format: ${hasAtSymbol ? 'userPrincipalName (with @)' : 'sAMAccountName (no @)'}`);
    console.log(`${logPrefix} Username: "${username}"`);
    console.log(`${logPrefix} Starting authentication...`);

    // Authenticate against Active Directory
    const authStartTime = Date.now();
    const user = await adService.authenticate(username, password);
    const authDuration = Date.now() - authStartTime;

    if (!user) {
      console.log(`${logPrefix} ❌ Authentication FAILED (${authDuration}ms)`);
      console.log(`${logPrefix} ========================================`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please check your username and password.',
      });
    }

    console.log(`${logPrefix} ✅ Authentication SUCCESS (${authDuration}ms)`);
    console.log(`${logPrefix} User authenticated: ${user.username}`);
    console.log(`${logPrefix} Display name: ${user.displayName}`);
    console.log(`${logPrefix} Email: ${user.email}`);
    console.log(`${logPrefix} Groups: ${user.groups?.length || 0}`);

    // Generate JWT token
    const token = generateToken(user);

    // TODO: Add Power BI token generation here
    // const powerBiToken = await getPowerBiToken(user);

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        groups: user.groups || [],
      },
      // powerBiToken: powerBiToken, // Uncomment when Power BI integration is ready
    });
    
    console.log(`${logPrefix} Response sent successfully`);
    console.log(`${logPrefix} ========================================`);
  } catch (error: any) {
    console.error(`${logPrefix} ❌ EXCEPTION in login handler`);
    console.error(`${logPrefix} Error type: ${error.name || 'Unknown'}`);
    console.error(`${logPrefix} Error message: ${error.message}`);
    if (error.stack) {
      console.error(`${logPrefix} Error stack:`, error.stack);
    }
    console.log(`${logPrefix} ========================================`);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.',
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify if a JWT token is still valid
 */
router.post('/verify', async (req: Request, res: Response) => {
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

/**
 * POST /api/auth/logout
 * Logout user (mainly for client-side token removal)
 */
router.post('/logout', async (req: Request, res: Response) => {
  // In a stateless JWT system, logout is typically handled client-side
  // by removing the token. You might want to maintain a blacklist here.
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/test-ldap
 * Test LDAP connection and configuration (for debugging)
 */
router.get('/test-ldap', async (req: Request, res: Response) => {
  try {
    const { ldapConfig } = await import('../config/ldap.config');
    
    res.json({
      success: true,
      config: {
        url: ldapConfig.url,
        baseDN: ldapConfig.baseDN,
        timeout: ldapConfig.timeout,
        connectTimeout: ldapConfig.connectTimeout,
      },
      message: 'LDAP configuration loaded. Check server logs for detailed authentication logs.',
      instructions: [
        '1. Try logging in with a user account',
        '2. Check the server console for detailed logs',
        '3. Look for [LDAP Auth] and [LDAP Search] prefixes',
        '4. Common issues:',
        '   - Wrong username format (try with/without @)',
        '   - UserPrincipalName not set in AD',
        '   - Account disabled',
        '   - Password incorrect',
        '   - Network connectivity issues',
      ],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/powerbi-token
 * Get Power BI access token for SSO (TODO: Implement Power BI authentication)
 */
router.get('/powerbi-token', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // TODO: Implement Power BI token generation
    // const powerBiToken = await getPowerBiToken(decoded);
    
    res.json({
      token: null, // Replace with actual Power BI token
      message: 'Power BI integration not yet implemented',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

