const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const params = [];
  let query = `SELECT t.*, u.name as poster_name FROM tasks t
               JOIN users u ON u.id = t.poster_id
               WHERE t.status = 'open'`;
  if (category && category !== 'All') {
    params.push(category);
    query += ` AND t.category = $${params.length}`;
  }
  query += ' ORDER BY t.created_at DESC';

  const result = await pool.query(query, params);
  res.json(result.rows);
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { title, description, category, payPaise, proofType, deadline } = req.body;
  if (!title || !category || !payPaise) {
    return res.status(400).json({ error: 'title, category and payPaise are required' });
  }

  const result = await pool.query(
    `INSERT INTO tasks (poster_id, title, description, category, pay_paise, proof_type, deadline, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft') RETURNING *`,
    [req.userId, title, description, category, payPaise, proofType || 'photo', deadline || null]
  );

  res.status(201).json(result.rows[0]);
}));

router.post('/:id/accept', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `UPDATE tasks SET status = 'accepted', assigned_worker_id = $1
     WHERE id = $2 AND status = 'open' RETURNING *`,
    [req.userId, id]
  );
  if (result.rows.length === 0) {
    return res.status(409).json({ error: 'Task is no longer available' });
  }
  res.json(result.rows[0]);
}));

router.post('/:id/submit', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { proofUrl, note } = req.body;

  const task = (await pool.query('SELECT * FROM tasks WHERE id = $1', [id])).rows[0];
  if (!task || task.assigned_worker_id !== req.userId) {
    return res.status(403).json({ error: 'You are not assigned to this task' });
  }

  await pool.query(
    `INSERT INTO submissions (task_id, worker_id, proof_url, note) VALUES ($1, $2, $3, $4)`,
    [id, req.userId, proofUrl, note]
  );
  await pool.query(`UPDATE tasks SET status = 'submitted' WHERE id = $1`, [id]);

  res.json({ submitted: true });
}));

router.post('/:id/approve', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = (await pool.query('SELECT * FROM tasks WHERE id = $1', [id])).rows[0];

  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.poster_id !== req.userId) return res.status(403).json({ error: 'Not your task' });
  if (task.status !== 'submitted') return res.status(400).json({ error: 'Nothing to approve yet' });

  await pool.query('BEGIN');
  try {
    await pool.query(`UPDATE tasks SET status = 'approved' WHERE id = $1`, [id]);
    await pool.query(
      `UPDATE submissions SET status = 'approved', reviewed_at = now() WHERE task_id = $1`,
      [id]
    );
    await pool.query(
      `INSERT INTO wallets (user_id, balance_paise)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET balance_paise = wallets.balance_paise + $2, updated_at = now()`,
      [task.assigned_worker_id, task.pay_paise]
    );
    await pool.query(
      `INSERT INTO payments (user_id, task_id, type, amount_paise, status)
       VALUES ($1, $2, 'escrow_release', $3, 'paid')`,
      [task.assigned_worker_id, id, task.pay_paise]
    );
    await pool.query('COMMIT');
    res.json({ approved: true });
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
}));

module.exports = router;
