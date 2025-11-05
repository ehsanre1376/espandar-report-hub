import { Request } from 'express';

// In-memory storage for login attempts.
// Maps store counts for usernames and IP addresses.
const attemptsByUsername = new Map<string, number>();
const attemptsByIp = new Map<string, number>();

// Maximum number of failed attempts before requiring CAPTCHA.
const MAX_ATTEMPTS = 3;

/**
 * Extracts the client's IP address from the request object.
 * It handles the 'x-forwarded-for' header for requests behind a proxy.
 * @param req - The Express request object.
 * @returns The client's IP address.
 */
export const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0].trim();
  }
  // Fallback to req.ip, then socket.remoteAddress, then an empty string.
  return req.ip || req.socket.remoteAddress || '';
};

/**
 * Increments the failed login attempt counters for a given username and IP address.
 * @param username - The username that failed to log in.
 * @param ip - The IP address from which the attempt was made.
 */
export const incrementFailureCount = (username: string, ip: string): void => {
  const currentUserAttempts = attemptsByUsername.get(username) || 0;
  const currentIpAttempts = attemptsByIp.get(ip) || 0;

  attemptsByUsername.set(username, currentUserAttempts + 1);
  attemptsByIp.set(ip, currentIpAttempts + 1);

  console.log(`Failed login attempt for user "${username}" from IP ${ip}.`);
  console.log(`  - User attempts: ${attemptsByUsername.get(username)}`);
  console.log(`  - IP attempts: ${attemptsByIp.get(ip)}`);
};

/**
 * Resets the failed login attempt counters for a given username and IP address.
 * This should be called after a successful login.
 * @param username - The username that successfully logged in.
 * @param ip - The IP address from which the successful login was made.
 */
export const resetFailureCount = (username: string, ip: string): void => {
  attemptsByUsername.delete(username);
  attemptsByIp.delete(ip);
  console.log(`Login counters reset for user "${username}" and IP ${ip}.`);
};

/**
 * Checks if a CAPTCHA should be required based on the number of failed attempts
 * for a given username or IP address.
 * @param username - The username attempting to log in.
 * @param ip - The IP address from which the attempt is being made.
 * @returns True if CAPTCHA is required, false otherwise.
 */
export const shouldRequireCaptcha = (username: string, ip: string): boolean => {
  const userAttempts = attemptsByUsername.get(username) || 0;
  const ipAttempts = attemptsByIp.get(ip) || 0;

  if (userAttempts >= MAX_ATTEMPTS || ipAttempts >= MAX_ATTEMPTS) {
    console.log(`CAPTCHA required for user "${username}" or IP ${ip}.`);
    return true;
  }

  return false;
};