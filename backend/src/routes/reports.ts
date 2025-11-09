import { Router, Request, Response } from 'express';
import { verifyToken } from '../services/jwtService';
import { URL } from 'url';
import http from 'http';
import https from 'https';
import { permissionService } from '../services/permissionService';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * Make a HEAD request to check if a URL is accessible
 */
const checkUrlAccess = (urlString: string, timeout: number = 5000): Promise<{ status: number; accessible: boolean }> => {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlString);
      const httpModule = url.protocol === 'https:' ? https : http;

      const options = {
        method: 'HEAD',
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          'User-Agent': 'Espandar-Report-Hub/1.0',
        },
        // Allow self-signed certificates (use with caution)
        rejectUnauthorized: false,
      };

      const req = httpModule.request(options, (res) => {
        // We consider any response from the server as accessible
        // This includes 2xx, 3xx, 4xx, and 5xx status codes
        const accessible = res.statusCode !== undefined && res.statusCode > 0;
        
        resolve({ status: res.statusCode || 0, accessible });
        
        // Destroy the socket to close the connection immediately
        res.destroy();
      });

      req.on('error', (error) => {
        console.error(`Error checking URL access for ${urlString}:`, error.message);
        // If there's an error (e.g., DNS lookup failure, connection refused), the URL is not accessible
        resolve({ status: 0, accessible: false });
      });

      req.setTimeout(timeout, () => {
        req.destroy(new Error(`Request timed out after ${timeout}ms`));
      });

      req.end();
    } catch (error: any) {
      console.error(`Error parsing URL ${urlString}:`, error.message);
      // If the URL is invalid, it's not accessible
      resolve({ status: 0, accessible: false });
    }
  });
};

/**
 * POST /api/reports/check-permission
 * Check if user has permission to access a specific report
 */
router.post('/check-permission', async (req: Request, res: Response) => {
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

    const { reportUrl } = req.body;

    if (!reportUrl) {
      return res.status(400).json({ error: 'Report URL is required' });
    }

    // TODO: Implement actual permission check against BI server
    // For now, we'll do a basic HEAD request to check if the report is accessible
    // In production, you should check against your BI server's permission system
    
    try {
      const { status, accessible } = await checkUrlAccess(reportUrl, 5000);

      res.json({
        hasPermission: accessible,
        status,
        message: accessible 
          ? 'Report is accessible' 
          : `Report access denied (status: ${status})`,
      });
    } catch (error: any) {
      console.error('Error checking report permission:', error);
      
      // Default to true for graceful degradation (you can change this to false for stricter security)
      res.json({
        hasPermission: true,
        status: 'error',
        message: 'Could not verify permission, allowing access',
      });
    }
  } catch (error: any) {
    console.error('Error in check-permission route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/reports/check-permissions
 * Check permissions for multiple reports in batch
 */
router.post('/check-permissions', async (req: Request, res: Response) => {
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

    const { reports } = req.body;

    if (!Array.isArray(reports)) {
      return res.status(400).json({ error: 'Reports array is required' });
    }

    // Check permissions for all reports
    const permissions = await Promise.all(
      reports.map(async (report: { id: string; url: string }) => {
        try {
          const { status, accessible } = await checkUrlAccess(report.url, 5000);

          return {
            reportId: report.id,
            reportUrl: report.url,
            hasPermission: accessible,
            status,
          };
        } catch (error: any) {
          console.error(`Error checking permission for report ${report.id}:`, error);
          // Default to true for graceful degradation
          return {
            reportId: report.id,
            reportUrl: report.url,
            hasPermission: true,
            status: 'error',
          };
        }
      })
    );

    res.json({ permissions });
  } catch (error: any) {
    console.error('Error in check-permissions route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reports/allowed
 * Return allowed report IDs for the current user from JWT claims or recompute.
 */
router.get('/allowed', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as any;
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    let allowedReportIds: string[] | undefined = decoded.allowedReportIds;
    if (!Array.isArray(allowedReportIds)) {
      // Recompute if not present in token
      allowedReportIds = permissionService.getAllowedReportIds({
        username: decoded.username,
        email: decoded.email,
        displayName: decoded.displayName,
        groups: decoded.groups || [],
      });
    }

    res.json({ allowedReportIds });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/reports/catalog
 * Serve the catalog (categories/reports) from a JSON file so non-devs can edit it.
 */
router.get('/catalog', async (req: Request, res: Response) => {
  try {
    const catalogPath = path.join(__dirname, '..', 'config', 'reports.config.json');
    fs.readFile(catalogPath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading reports catalog:', err);
        return res.status(500).json({ error: 'Could not load reports catalog' });
      }
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch (parseErr) {
        console.error('Error parsing reports catalog JSON:', parseErr);
        res.status(500).json({ error: 'Invalid reports catalog format' });
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

