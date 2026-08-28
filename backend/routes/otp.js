const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { asyncHandler } = require('../middleware/asyncHandler');

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

  if (method === 'email') {
    await sendOtpEmail(identifier, code);
  } else {
    await sendOtpSms(identifier, code);
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
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
}));

async function sendOtpEmail(email, code) {
  if (!process.env.SMTP_HOST) {
    console.log(`[DEV MODE — no SMTP configured] OTP for ${email} is: ${code}`);
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
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[DEV MODE — no SMS provider configured] OTP for ${phone} is: ${code}`);
    return;
  }
  // npm install twilio, then uncomment:
  // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await twilio.messages.create({
  //   body: `Your OnlineDaftar login code is ${code}. Valid for 5 minutes.`,
  //   from: process.env.TWILIO_FROM_NUMBER,
  //   to: `+91${phone}`,
  // });
}

module.exports = router;
