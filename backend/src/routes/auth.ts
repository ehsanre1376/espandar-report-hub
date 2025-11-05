import { Router, Request, Response } from 'express';
import { ADService } from '../services/adService';
import { generateToken, verifyToken } from '../services/jwtService';
import {
  shouldRequireCaptcha,
  incrementFailureCount,
  resetFailureCount,
  getClientIp,
} from '../utils/attemptTracker';
import { verifyCaptchaToken } from '../utils/captchaVerifier';

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
    const { username, password, captchaToken } = req.body;
    const clientIp = getClientIp(req);

    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} Login request received`);
    console.log(`${logPrefix} IP: ${clientIp}`);
    console.log(`${logPrefix} User-Agent: ${req.get('user-agent') || 'N/A'}`);

    // Validate input
    if (!username || !password) {
      console.log(`${logPrefix} ❌ Missing credentials`);
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // CAPTCHA Verification
    if (shouldRequireCaptcha(username, clientIp)) {
      console.log(`${logPrefix} CAPTCHA is required.`);
      if (!captchaToken) {
        return res.status(400).json({
          success: false,
          error: 'CAPTCHA token is missing.',
          captchaRequired: true,
        });
      }
      const isCaptchaValid = await verifyCaptchaToken(captchaToken, clientIp);
      if (!isCaptchaValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CAPTCHA. Please try again.',
          captchaRequired: true,
        });
      }
      console.log(`${logPrefix} CAPTCHA verification successful.`);
    }

    // Log username format
    console.log(`${logPrefix} Username: "${username}"`);
    console.log(`${logPrefix} Starting authentication...`);

    // Authenticate against Active Directory
    const authStartTime = Date.now();
    const user = await adService.authenticate(username, password);
    const authDuration = Date.now() - authStartTime;

    if (!user) {
      console.log(`${logPrefix} ❌ Authentication FAILED (${authDuration}ms)`);
      incrementFailureCount(username, clientIp);
      const captchaRequired = shouldRequireCaptcha(username, clientIp);
      console.log(`${logPrefix} ========================================`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please check your username and password.',
        captchaRequired,
      });
    }

    console.log(`${logPrefix} ✅ Authentication SUCCESS (${authDuration}ms)`);
    resetFailureCount(username, clientIp);
    
    console.log(`${logPrefix} User authenticated: ${user.username}`);
    console.log(`${logPrefix} Display name: ${user.displayName}`);
    console.log(`${logPrefix} Email: ${user.email}`);

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        groups: user.groups || [],
      },
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

