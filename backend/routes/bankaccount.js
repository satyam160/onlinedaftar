const express = require('express');
const Razorpay = require('razorpay');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function ensureContact(user) {
  if (user.razorpay_contact_id) return user.razorpay_contact_id;

  const contact = await razorpay.contacts.create({
    name: user.name,
    email: user.email || undefined,
    contact: user.phone || undefined,
    type: 'customer',
  });

  await pool.query('UPDATE users SET razorpay_contact_id = $1 WHERE id = $2', [contact.id, user.id]);
  return contact.id;
}

router.post('/link-bank', requireAuth, asyncHandler(async (req, res) => {
  const { accountNumber, ifsc, accountHolderName } = req.body;
  if (!accountNumber || !ifsc || !accountHolderName) {
    return res.status(400).json({ error: 'accountNumber, ifsc, and accountHolderName are required' });
  }
  if (!/^\d{9,18}$/.test(accountNumber)) {
    return res.status(400).json({ error: 'Enter a valid account number' });
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) {
    return res.status(400).json({ error: 'Enter a valid IFSC code' });
  }

  const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
  const user = userResult.rows[0];

  let contactId, fundAccount;
  try {
    contactId = await ensureContact(user);
    fundAccount = await razorpay.fundAccount.create({
      contact_id: contactId,
      account_type: 'bank_account',
      bank_account: {
        name: accountHolderName,
        ifsc: ifsc.toUpperCase(),
        account_number: accountNumber,
      },
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Razorpay rejected the bank link — this usually means RazorpayX Payouts isn\'t enabled on your account yet.',
      razorpayError: err.error?.description || err.message,
    });
  }

  const last4 = accountNumber.slice(-4);
  await pool.query(
    `UPDATE users SET razorpay_fund_account_id = $1, bank_account_last4 = $2, upi_id = NULL WHERE id = $3`,
    [fundAccount.id, last4, req.userId]
  );

  res.json({ linked: true, last4 });
}));

router.post('/link-upi', requireAuth, asyncHandler(async (req, res) => {
  const { upiId } = req.body;
  if (!upiId || !/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
    return res.status(400).json({ error: 'Enter a valid UPI ID (e.g. name@bank)' });
  }

  const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
  const user = userResult.rows[0];

  let contactId, fundAccount;
  try {
    contactId = await ensureContact(user);
    fundAccount = await razorpay.fundAccount.create({
      contact_id: contactId,
      account_type: 'vpa',
      vpa: { address: upiId },
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Razorpay rejected the UPI link — this usually means RazorpayX Payouts isn\'t enabled on your account yet.',
      razorpayError: err.error?.description || err.message,
    });
  }

  await pool.query(
    `UPDATE users SET razorpay_fund_account_id = $1, upi_id = $2, bank_account_last4 = NULL WHERE id = $3`,
    [fundAccount.id, upiId, req.userId]
  );

  res.json({ linked: true, upiId });
}));

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT bank_account_last4, upi_id, razorpay_fund_account_id FROM users WHERE id = $1',
    [req.userId]
  );
  const user = result.rows[0];
  res.json({
    linked: !!user.razorpay_fund_account_id,
    bankAccountLast4: user.bank_account_last4,
    upiId: user.upi_id,
  });
}));

module.exports = router;
