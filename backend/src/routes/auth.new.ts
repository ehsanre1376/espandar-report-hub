import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { verifyToken } from '../services/jwtService';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

interface Admin {
  username: string;
  email?: string;
  addedAt: string;
}

interface AdminList {
  admins: string[];
}

const getAdminsPath = () => path.join(__dirname, '..', 'config', 'admins.json');

// Helper function to read and parse admins file
const readAdmins = async (): Promise<AdminList> => {
  try {
    const adminsPath = getAdminsPath();
    console.log('Reading admins from:', adminsPath);
    const data = await readFileAsync(adminsPath, 'utf-8');
    const adminList = JSON.parse(data);
    
    if (!adminList.admins) {
      adminList.admins = [];
    }
    
    return adminList;
  } catch (error) {
    console.error('Error reading admins:', error);
    throw new Error('Could not read admins file');
  }
};

// Helper function to write admins file
const writeAdmins = async (adminList: AdminList): Promise<void> => {
  try {
    const adminsPath = getAdminsPath();
    console.log('Writing admins to:', adminsPath);
    console.log('Admins content:', JSON.stringify(adminList, null, 2));
    await writeFileAsync(adminsPath, JSON.stringify(adminList, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing admins:', error);
    throw new Error('Could not write admins file');
  }
};

/**
 * GET /api/auth/admins
 * Get list of admin users
 */
router.get('/admins', adminOnly, async (req: Request, res: Response) => {
  try {
    const adminList = await readAdmins();
    res.json({ admins: adminList.admins });
  } catch (error) {
    console.error('Error reading admins:', error);
    res.status(500).json({ error: 'Could not read admins list' });
  }
});

/**
 * POST /api/auth/admins
 * Add a new admin user
 */
router.post('/admins', adminOnly, async (req: Request, res: Response) => {
  try {
    console.log('Add admin request received:', req.body);
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const adminList = await readAdmins();
    
    // Normalize username (remove @domain.com if present)
    const normalizedUsername = username.split('@')[0];
    
    if (adminList.admins.includes(normalizedUsername)) {
      return res.status(409).json({ error: 'User is already an admin' });
    }

    console.log('Adding new admin:', normalizedUsername);
    adminList.admins.push(normalizedUsername);

    await writeAdmins(adminList);
    console.log('Admin added successfully');
    res.status(201).json({ message: 'Admin added successfully' });

  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ error: 'Could not add admin' });
  }
});

/**
 * DELETE /api/auth/admins/:username
 * Remove an admin user
 */
router.delete('/admins/:username', adminOnly, async (req: Request, res: Response) => {
  try {
    console.log('Remove admin request received:', req.params);
    const { username } = req.params;

    const adminList = await readAdmins();
    
    const normalizedUsername = username.split('@')[0];
    const index = adminList.admins.indexOf(normalizedUsername);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    adminList.admins.splice(index, 1);
    console.log(`Removed admin: ${normalizedUsername}`);

    await writeAdmins(adminList);
    res.json({ message: 'Admin removed successfully' });

  } catch (error) {
    console.error('Error removing admin:', error);
    res.status(500).json({ error: 'Could not remove admin' });
  }
});

export default router;