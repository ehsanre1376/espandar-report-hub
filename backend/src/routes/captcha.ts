
import express from 'express';
import svgCaptcha from 'svg-captcha';

const router = express.Router();

router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create();
  req.session.captcha = captcha.text;
  res.type('svg');
  res.status(200).send(captcha.data);
});

export default router;
