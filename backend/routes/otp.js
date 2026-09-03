const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests. Please wait 15 minutes and try again.' },
});
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please request a new code.' },
});

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(code, identifier) {
  return crypto.createHash('sha256').update(`${code}:${identifier}:${process.env.JWT_SECRET}`).digest('hex');
}

function isValidPhone(v) { return /^[6-9]\d{9}$/.test(v); }
function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

router.post('/send', otpSendLimiter, asyncHandler(async (req, res) => {
  const { identifier, method } = req.body;

  if (method === 'mobile' && !isValidPhone(identifier)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
  }
  if (method === 'email' && !isValidEmail(identifier)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }

  const code = generateOtp();
  const codeHash = hashOtp(code, identifier);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await pool.query(
    `INSERT INTO otp_codes (identifier, method, code_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [identifier, method, codeHash, expiresAt]
  );

  try {
    if (method === 'email') {
      await sendOtpEmail(identifier, code);
    } else {
      await sendOtpSms(identifier, code);
    }
  } catch (err) {
    console.error('OTP delivery failed:', err.message);
    return res.status(502).json({
      error: `Could not send ${method === 'email' ? 'email' : 'SMS'}: ${err.message}`,
    });
  }

  res.json({ sent: true, expiresInSeconds: 300 });
}));

router.post('/verify', otpVerifyLimiter, asyncHandler(async (req, res) => {
  const { identifier, method, code, name } = req.body;
  if (!identifier || !code) return res.status(400).json({ error: 'identifier and code are required' });

  const result = await pool.query(
    `SELECT * FROM otp_codes WHERE identifier = $1 AND consumed = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [identifier]
  );
  const record = result.rows[0];

  if (!record) return res.status(400).json({ error: 'No pending code — request a new one' });
  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Code expired — request a new one' });
  }
  if (record.attempts >= 5) {
    return res.status(429).json({ error: 'Too many incorrect attempts — request a new code' });
  }

  const codeHash = hashOtp(code, identifier);
  if (codeHash !== record.code_hash) {
    await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [record.id]);
    return res.status(400).json({ error: 'Incorrect code' });
  }

  await pool.query('UPDATE otp_codes SET consumed = TRUE WHERE id = $1', [record.id]);

  const column = method === 'email' ? 'email' : 'phone';
  let userResult = await pool.query(`SELECT * FROM users WHERE ${column} = $1`, [identifier]);
  let user = userResult.rows[0];

  if (!user) {
    const created = await pool.query(
      `INSERT INTO users (name, ${column}) VALUES ($1, $2) RETURNING *`,
      [name || 'New User', identifier]
    );
    user = created.rows[0];
    await pool.query('INSERT INTO wallets (user_id, balance_paise) VALUES ($1, 0)', [user.id]);
  } else if (name && name.trim() && name.trim() !== user.name) {
    const updated = await pool.query(
      `UPDATE users SET name = $1 WHERE id = $2 RETURNING *`,
      [name.trim(), user.id]
    );
    user = updated.rows[0];
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
}));

router.post('/link-send', otpSendLimiter, requireAuth, asyncHandler(async (req, res) => {
  const { identifier, method } = req.body;

  if (method === 'mobile' && !isValidPhone(identifier)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
  }
  if (method === 'email' && !isValidEmail(identifier)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }

  const column = method === 'email' ? 'email' : 'phone';
  const existing = await pool.query(`SELECT id FROM users WHERE ${column} = $1`, [identifier]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'That ' + method + ' is already linked to another account' });
  }

  const code = generateOtp();
  const codeHash = hashOtp(code, identifier);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await pool.query(
    `INSERT INTO otp_codes (identifier, method, code_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [identifier, method, codeHash, expiresAt]
  );

  try {
    if (method === 'email') await sendOtpEmail(identifier, code);
    else await sendOtpSms(identifier, code);
  } catch (err) {
    console.error('OTP delivery failed:', err.message);
    return res.status(502).json({ error: `Could not send ${method === 'email' ? 'email' : 'SMS'}: ${err.message}` });
  }

  res.json({ sent: true, expiresInSeconds: 300 });
}));

router.post('/link-verify', otpVerifyLimiter, requireAuth, asyncHandler(async (req, res) => {
  const { identifier, method, code } = req.body;

  const result = await pool.query(
    `SELECT * FROM otp_codes WHERE identifier = $1 AND consumed = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [identifier]
  );
  const record = result.rows[0];
  if (!record) return res.status(400).json({ error: 'No pending code — request a new one' });
  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Code expired — request a new one' });
  }

  const codeHash = hashOtp(code, identifier);
  if (codeHash !== record.code_hash) {
    await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [record.id]);
    return res.status(400).json({ error: 'Incorrect code' });
  }
  await pool.query('UPDATE otp_codes SET consumed = TRUE WHERE id = $1', [record.id]);

  const column = method === 'email' ? 'email' : 'phone';
  const updated = await pool.query(
    `UPDATE users SET ${column} = $1 WHERE id = $2 RETURNING id, name, email, phone`,
    [identifier, req.userId]
  );

  res.json({ linked: true, user: updated.rows[0] });
}));

async function sendOtpEmail(email, code) {
  if (process.env.RESEND_API_KEY) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'OnlineDaftar <onboarding@resend.dev>',
        to: email,
        subject: 'Your OnlineDaftar login code',
        text: `Your login code is ${code}. It expires in 5 minutes. Never share this code with anyone.`,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error('Resend rejected the request: ' + body);
    }
    return;
  }

  if (!process.env.SMTP_HOST) {
    console.log(`[DEV MODE — no email provider configured] OTP for ${email} is: ${code}`);
    return;
  }
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'OnlineDaftar <noreply@onlinedaftar.com>',
    to: email,
    subject: 'Your OnlineDaftar login code',
    text: `Your login code is ${code}. It expires in 5 minutes. Never share this code with anyone.`,
  });
}

async function sendOtpSms(phone, code) {
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();

  if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID) {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({
      body: `Your OnlineDaftar login code is ${code}. Valid for 5 minutes. Never share this with anyone.`,
      from: process.env.TWILIO_FROM_NUMBER,
      to: `+91${phone}`,
    });
    return;
  }

  if (provider === 'msg91' && process.env.MSG91_AUTH_KEY) {
    const resp = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        mobile: `91${phone}`,
        otp: code,
        template_id: process.env.MSG91_TEMPLATE_ID,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error('MSG91 rejected the request: ' + body);
    }
    return;
  }

  console.log(`[DEV MODE — no SMS provider configured] OTP for ${phone} is: ${code}`);
}

module.exports = router;
