import fetch from 'node-fetch';

const VERIFY_URL = process.env.RECAPTCHA_VERIFICATION_URL || 'https://www.google.com/recaptcha/api/siteverify';
const SECRET = process.env.RECAPTCHA_SECRET_KEY || '';

export interface RecaptchaVerifyResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  ['error-codes']?: string[];
}

/**
 * Verifies a reCAPTCHA v2 token with Google's API.
 * Returns parsed JSON result. Handles network errors and returns success=false on error.
 */
export async function verifyCaptchaToken(token: string, remoteip?: string): Promise<RecaptchaVerifyResult> {
  if (!SECRET) {
    console.error('[reCAPTCHA] Missing RECAPTCHA_SECRET_KEY in environment');
    return { success: false, ['error-codes']: ['missing-secret'] };
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', SECRET);
    params.append('response', token);
    if (remoteip) params.append('remoteip', remoteip);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      // Note: use reasonable timeout handled by hosting infra; node-fetch v2 doesn't support timeout easily
    });

    if (!res.ok) {
      console.error('[reCAPTCHA] verification HTTP error', res.status, res.statusText);
      return { success: false, ['error-codes']: ['http-error'] };
    }

    const data = (await res.json()) as RecaptchaVerifyResult;
    return data;
  } catch (err: any) {
    console.error('[reCAPTCHA] verification failed', err?.message || err);
    return { success: false, ['error-codes']: ['network-error'] };
  }
}
