import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwtService';
import fs from 'fs';
import path from 'path';

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const adminsPath = path.join(__dirname, '..', 'config', 'admins.json');
  fs.readFile(adminsPath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading admins file:', err);
      return res.status(500).json({ error: 'Could not read admins file' });
    }
    try {
      const { admins } = JSON.parse(data);
      const userIdentifiers = [
        decoded.username,
        decoded.email,
        decoded.username.split('@')[0]
      ].filter(Boolean);
      
      if (userIdentifiers.some(id => admins.includes(id))) {
        next();
      } else {
        console.log('Access denied for user:', userIdentifiers);
        console.log('Current admins:', admins);
        res.status(403).json({ error: 'Forbidden - You must be an admin to access this resource' });
      }
    } catch (parseErr) {
      console.error('Error parsing admins file:', parseErr);
      res.status(500).json({ error: 'Invalid admins file format' });
    }
  });
};
