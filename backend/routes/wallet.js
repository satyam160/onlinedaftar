const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const walletResult = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [req.userId]);
  const txResult = await pool.query(
    `SELECT p.*, t.title as task_title FROM payments p
     LEFT JOIN tasks t ON t.id = p.task_id
     WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT 50`,
    [req.userId]
  );

  res.json({
    balancePaise: walletResult.rows[0]?.balance_paise || 0,
    transactions: txResult.rows,
  });
}));

module.exports = router;
