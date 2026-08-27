const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/create-escrow-order', express.json(), requireAuth, asyncHandler(async (req, res) => {
  const { taskId } = req.body;

  const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  const task = taskResult.rows[0];
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.poster_id !== req.userId) return res.status(403).json({ error: 'Not your task' });

  let order;
  try {
    order = await razorpay.orders.create({
      amount: task.pay_paise,
      currency: 'INR',
      receipt: `escrow_${task.id}`,
      notes: { taskId: task.id, purpose: 'escrow_fund' },
    });
  } catch (err) {
    // Most common cause: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env are
    // still the placeholder values, or wrong. Surface that clearly instead
    // of a generic crash.
    return res.status(502).json({
      error: 'Razorpay rejected the request — check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env are real test keys.',
      razorpayError: err.error?.description || err.message,
    });
  }

  const payment = await pool.query(
    `INSERT INTO payments (user_id, task_id, type, amount_paise, razorpay_order_id, status)
     VALUES ($1, $2, 'escrow_fund', $3, $4, 'created') RETURNING id`,
    [req.userId, task.id, task.pay_paise, order.id]
  );

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    paymentRecordId: payment.rows[0].id,
  });
}));

router.post('/verify', express.json(), requireAuth, asyncHandler(async (req, res) => { {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, taskId } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  await pool.query(
    `UPDATE payments SET status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2
     WHERE razorpay_order_id = $3`,
    [razorpay_payment_id, razorpay_signature, razorpay_order_id]
  );

  const payment = await pool.query('SELECT * FROM payments WHERE razorpay_order_id = $1', [razorpay_order_id]);
  await pool.query(
    `UPDATE tasks SET status = 'open', escrow_payment_id = $1 WHERE id = $2`,
    [payment.rows[0].id, taskId]
  );

  res.json({ verified: true });
}));

router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== expected) return res.status(400).json({ error: 'Invalid webhook signature' });

  const event = JSON.parse(req.body);
  if (event.event === 'payment.captured') {
    const orderId = event.payload.payment.entity.order_id;
    await pool.query(`UPDATE payments SET status = 'paid' WHERE razorpay_order_id = $1`, [orderId]);
  }

  res.json({ received: true });
}));

router.post('/withdraw', requireAuth, asyncHandler(async (req, res) => {
  const walletResult = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [req.userId]);
  const wallet = walletResult.rows[0];
  if (!wallet || wallet.balance_paise <= 0) {
    return res.status(400).json({ error: 'No balance available to withdraw' });
  }

  const amount = wallet.balance_paise;

  await pool.query('BEGIN');
  try {
    await pool.query('UPDATE wallets SET balance_paise = 0, updated_at = now() WHERE user_id = $1', [req.userId]);
    const payment = await pool.query(
      `INSERT INTO payments (user_id, type, amount_paise, status)
       VALUES ($1, 'withdrawal', $2, 'created') RETURNING id`,
      [req.userId, amount]
    );
    await pool.query('COMMIT');
    res.json({
      withdrawalId: payment.rows[0].id,
      amount,
      note: 'Withdrawal recorded. Connect RazorpayX Payouts to actually disburse funds.'
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
}));

module.exports = router;
