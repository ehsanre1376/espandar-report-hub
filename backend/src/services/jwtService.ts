import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  username: string;
  email: string;
  displayName?: string;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(user: JWTPayload): string {
  const payload = {
    username: user.username,
    email: user.email,
    displayName: user.displayName,
  };
  
  // @ts-ignore - JWT_EXPIRES_IN is a valid string for expiresIn (e.g., '24h')
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

