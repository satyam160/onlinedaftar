const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

// GET /api/notifications — most recent 30 for the logged-in user
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
    [req.userId]
  );
  const unreadCount = result.rows.filter(n => !n.read).length;
  res.json({ notifications: result.rows, unreadCount });
}));

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', requireAuth, asyncHandler(async (req, res) => {
  await pool.query(`UPDATE notifications SET read = TRUE WHERE user_id = $1`, [req.userId]);
  res.json({ ok: true });
}));

module.exports = router;
