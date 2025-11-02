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
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    console.log(`Attempting to authenticate user: ${username}`);

    // Authenticate against Active Directory
    const user = await adService.authenticate(username, password);

    if (!user) {
      console.log(`Authentication failed for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please check your username and password.',
      });
    }

    console.log(`Authentication successful for user: ${user.username}`);

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
  } catch (error: any) {
    console.error('Login error:', error);
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

