import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFICATION_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verifies a Google reCAPTCHA v2 token.
 * @param token - The reCAPTCHA token sent from the frontend.
 * @param clientIp - The IP address of the user making the request.
 * @returns A promise that resolves to a boolean indicating if the token is valid.
 */
export const verifyCaptchaToken = async (token: string, clientIp: string): Promise<boolean> => {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error('reCAPTCHA secret key is not configured. Verification skipped.');
    // In a production environment, you might want to fail closed (return false).
    // For development, we can allow it to pass to avoid blocking logins.
    return process.env.NODE_ENV !== 'production';
  }

  const verificationUrl = `${RECAPTCHA_VERIFICATION_URL}?secret=${RECAPTCHA_SECRET_KEY}&response=${token}&remoteip=${clientIp}`;

  try {
    const response = await fetch(verificationUrl, { method: 'POST' });
    const data = await response.json() as { success: boolean; 'error-codes'?: string[]; [key: string]: any };

    if (data.success) {
      console.log('CAPTCHA verification successful.');
      return true;
    } else {
      console.warn('CAPTCHA verification failed:', data['error-codes'] || 'No error codes');
      return false;
    }
  } catch (error) {
    console.error('Error during CAPTCHA verification request:', error);
    // If the Google API fails, we can choose to fail open or closed.
    // Failing closed is more secure, but could lock users out if Google has issues.
    // Here, we return false to enforce the CAPTCHA check.
    return false;
  }
};