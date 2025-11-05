import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const RECAPTCHA_SECRET_KEY = '6Lco-QIsAAAAAGyW0-xzbLf0fwp6xARewdOLa2S9'; // Replace with your secret key

export const validateCaptcha = async (req: Request, res: Response, next: NextFunction) => {
  const { captchaValue } = req.body;

  // If captchaValue is not present, and it's the first login attempt, allow it.
  // The frontend will only send captchaValue after the first failed attempt.
  if (!captchaValue) {
    return next();
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaValue}`
    );

    if (response.data.success) {
      next();
    } else {
      res.status(400).json({ success: false, error: 'Invalid captcha' });
    }
  } catch (error) {
    console.error('Captcha verification error:', error);
    res.status(500).json({ success: false, error: 'Error verifying captcha' });
  }
};
