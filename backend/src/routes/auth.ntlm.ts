/// <reference path="../express-ntlm.d.ts" />
import { Router, Request, Response, RequestHandler } from 'express';
import ntlm from 'express-ntlm';
import { ldapConfig } from '../config/ldap.config';
import { ADService } from '../services/adService';
import { generateToken } from '../services/jwtService';
import {
  shouldRequireCaptcha,
  incrementFailureCount,
  resetFailureCount,
  getClientIp,
} from '../utils/attemptTracker';
import { verifyCaptchaToken } from '../utils/captchaVerifier';

const router = Router();
const adService = new ADService();

// NTLM middleware for automatic Windows authentication
// This only works on Windows systems
let ntlmMiddleware: RequestHandler | null = null;
try {
  ntlmMiddleware = ntlm({
    debug: (prefix: string, message: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[NTLM Middleware] ${prefix}: ${message}`);
      }
    },
    domain: ldapConfig.ntlmDomain,
    domaincontroller: ldapConfig.domainController,
  });
  console.log('✅ NTLM middleware initialized');
} catch (error) {
  console.warn('⚠️  NTLM middleware not available (may not be on Windows):', error);
}

/**
 * POST /api/auth/login/ntlm
 * Authenticate user with NTLM credentials (username/password)
 * This validates credentials through LDAP, same as regular login
 * but is explicitly for NTLM/Active Directory authentication
 */
router.post('/login/ntlm', async (req: Request, res: Response) => {
  const requestId = Date.now().toString(36);
  const logPrefix = `[NTLM Auth] [${requestId}] [${new Date().toISOString()}]`;
  
  try {
    const { username, password, captchaToken } = req.body;
    const clientIp = getClientIp(req);

    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} NTLM login request received`);
    console.log(`${logPrefix} IP: ${clientIp}`);
    console.log(`${logPrefix} User-Agent: ${req.get('user-agent') || 'N/A'}`);

    // Validate input
    if (!username || !password) {
      console.log(`${logPrefix} ❌ Missing credentials`);
      return res.status(400).json({
        success: false,
        error: 'Username and password are required for NTLM authentication',
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
    console.log(`${logPrefix} Starting NTLM authentication via LDAP...`);

    // Authenticate against Active Directory using LDAP
    // This reuses the same LDAP authentication logic as regular login
    const authStartTime = Date.now();
    const user = await adService.authenticate(username, password);
    const authDuration = Date.now() - authStartTime;

    if (!user) {
      console.log(`${logPrefix} ❌ NTLM Authentication FAILED (${authDuration}ms)`);
      incrementFailureCount(username, clientIp);
      const captchaRequired = shouldRequireCaptcha(username, clientIp);
      console.log(`${logPrefix} ========================================`);
      return res.status(401).json({
        success: false,
        error: 'Invalid NTLM credentials. Please check your username and password.',
        captchaRequired,
      });
    }

    console.log(`${logPrefix} ✅ NTLM Authentication SUCCESS (${authDuration}ms)`);
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
    console.error(`${logPrefix} ❌ EXCEPTION in NTLM login handler`);
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
 * Interface for NTLM request
 */
interface NtlmRequest extends Request {
  ntlm?: {
    UserName: string;
    DomainName: string;
    Workstation: string;
  };
}

/**
 * POST /api/auth/login/ntlm/sso
 * Automatic NTLM SSO - uses Windows logged-in user credentials
 * This endpoint requires express-ntlm middleware and Windows environment
 * User doesn't need to enter username/password - browser handles it automatically
 */
if (ntlmMiddleware) {
  router.post('/login/ntlm/sso', ntlmMiddleware, async (req: Request, res: Response) => {
    const requestId = Date.now().toString(36);
    const logPrefix = `[NTLM SSO] [${requestId}] [${new Date().toISOString()}]`;
    const ntlmReq = req as NtlmRequest;
    
    try {
      const clientIp = getClientIp(req);
      
      console.log(`${logPrefix} ========================================`);
      console.log(`${logPrefix} NTLM SSO request received`);
      console.log(`${logPrefix} IP: ${clientIp}`);
      console.log(`${logPrefix} User-Agent: ${req.get('user-agent') || 'N/A'}`);

      // Check if NTLM authentication was successful
      if (!ntlmReq.ntlm || !ntlmReq.ntlm.UserName) {
        console.log(`${logPrefix} ❌ NTLM authentication failed or not provided`);
        return res.status(401).json({
          success: false,
          error: 'NTLM authentication failed. Please ensure you are logged into Windows domain.',
        });
      }

      const windowsUsername = ntlmReq.ntlm.UserName;
      const domainName = ntlmReq.ntlm.DomainName || ldapConfig.ntlmDomain;
      const workstation = ntlmReq.ntlm.Workstation || 'Unknown';
      
      console.log(`${logPrefix} Windows username: "${windowsUsername}"`);
      console.log(`${logPrefix} Domain: "${domainName}"`);
      console.log(`${logPrefix} Workstation: "${workstation}"`);

      // Construct full username (domain\username or username@domain.com)
      let fullUsername = windowsUsername;
      if (domainName && !windowsUsername.includes('@') && !windowsUsername.includes('\\')) {
        // Try both formats
        fullUsername = `${windowsUsername}@${domainName}.com`;
      }

      console.log(`${logPrefix} Looking up user in AD: "${fullUsername}"`);

      // Find user in Active Directory
      const lookupStartTime = Date.now();
      const user = await adService.findUserByUsername(fullUsername);
      const lookupDuration = Date.now() - lookupStartTime;

      if (!user) {
        // Try with just the username part
        console.log(`${logPrefix} User not found with full username, trying username only...`);
        const userOnly = await adService.findUserByUsername(windowsUsername);
        
        if (!userOnly) {
          console.log(`${logPrefix} ❌ User not found in AD: "${windowsUsername}"`);
          console.log(`${logPrefix} ========================================`);
          return res.status(401).json({
            success: false,
            error: `User "${windowsUsername}" not found in Active Directory.`,
          });
        }
        
        console.log(`${logPrefix} ✅ User found with username only (${lookupDuration}ms)`);
        const token = generateToken(userOnly);

        res.json({
          success: true,
          token,
          user: {
            username: userOnly.username,
            displayName: userOnly.displayName,
            email: userOnly.email,
            groups: userOnly.groups || [],
          },
        });
        
        console.log(`${logPrefix} Response sent successfully`);
        console.log(`${logPrefix} ========================================`);
        return;
      }

      console.log(`${logPrefix} ✅ User found in AD (${lookupDuration}ms)`);
      console.log(`${logPrefix} User: ${user.username}`);
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
      console.error(`${logPrefix} ❌ EXCEPTION in NTLM SSO handler`);
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
} else {
  // Fallback endpoint if NTLM middleware is not available
  router.post('/login/ntlm/sso', async (req: Request, res: Response) => {
    res.status(503).json({
      success: false,
      error: 'NTLM SSO is not available on this system. NTLM middleware requires Windows environment.',
    });
  });
}

/**
 * GET /api/auth/ntlm/negotiate
 * Initiate NTLM negotiation for automatic Windows authentication
 * This endpoint can be used for browser-based NTLM SSO
 * Note: Full automatic Windows SSO requires express-ntlm middleware
 */
router.get('/ntlm/negotiate', async (req: Request, res: Response) => {
  const logPrefix = `[NTLM Negotiate] [${new Date().toISOString()}]`;
  console.log(`${logPrefix} NTLM negotiation request received`);
  
  // Set headers to trigger NTLM negotiation
  res.setHeader('WWW-Authenticate', 'NTLM');
  res.setHeader('Connection', 'Keep-Alive');
  res.status(401).json({
    success: false,
    message: 'NTLM authentication required',
    negotiate: true,
  });
});

export default router;
