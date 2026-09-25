const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// POST /api/auth/register
// Accepts username/name, email, password, and role
router.post('/register', asyncHandler(async (req, res) => {
  const { name, username, email, password, role } = req.body;
  const displayName = (username || name || '').trim();
  const userEmail = (email || '').trim().toLowerCase();

  if (!displayName || !password) {
    return res.status(400).json({ error: 'Username/Name and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Use email or fall back to a username-based handle if email not supplied
  const effectiveEmail = userEmail || `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}@onlinedaftar.local`;

  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR name = $2',
    [effectiveEmail, displayName]
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this username or email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, kyc_verified, rating_avg, rating_count, created_at`,
    [displayName, effectiveEmail, passwordHash, role || 'worker']
  );
  const user = result.rows[0];

  await pool.query('INSERT INTO wallets (user_id, balance_paise) VALUES ($1, 0)', [user.id]);

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user });
}));

// POST /api/auth/login
// Accepts username or email or phone along with password
router.post('/login', asyncHandler(async (req, res) => {
  const { username, email, identifier, password } = req.body;
  const loginId = (identifier || username || email || '').trim();

  if (!loginId || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  // Allow lookup by email, username/name, or phone
  const result = await pool.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1) OR phone = $1`,
    [loginId]
  );
  const user = result.rows[0];
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      kyc_verified: user.kyc_verified,
      rating_avg: user.rating_avg,
      rating_count: user.rating_count,
      bio: user.bio,
      created_at: user.created_at
    }
  });
}));

// GET /api/auth/me
// Returns current authenticated user profile
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, phone, role, kyc_verified, rating_avg, rating_count, bio, created_at
     FROM users WHERE id = $1`,
    [req.userId]
  );
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}));

// PATCH /api/auth/profile
// Updates profile bio or name
router.patch('/profile', requireAuth, asyncHandler(async (req, res) => {
  const { bio, name } = req.body;
  const updates = [];
  const params = [];

  if (bio !== undefined) {
    params.push(bio);
    updates.push(`bio = $${params.length}`);
  }
  if (name !== undefined && name.trim()) {
    params.push(name.trim());
    updates.push(`name = $${params.length}`);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(req.userId);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}
                 RETURNING id, name, email, phone, role, kyc_verified, rating_avg, rating_count, bio, created_at`;
  const result = await pool.query(query, params);
  res.json({ user: result.rows[0] });
}));

module.exports = router;
