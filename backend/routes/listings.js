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

// GET /api/listings?category=Stock+Footage — browse active listings.
// file_url is deliberately withheld here — only revealed after purchase,
// via GET /api/listings/mine/library.
router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const params = [];
  let query = `SELECT l.id, l.type, l.title, l.description, l.category, l.price_paise,
                      l.license_type, l.rental_days, l.preview_url, l.created_at,
                      u.name as seller_name
               FROM listings l
               JOIN users u ON u.id = l.seller_id
               WHERE l.status = 'active'`;
  if (category && category !== 'All') {
    params.push(category);
    query += ` AND l.category = $${params.length}`;
  }
  query += ' ORDER BY l.created_at DESC';

  const result = await pool.query(query, params);
  res.json(result.rows);
}));

// POST /api/listings — seller creates a new footage clip or editor package
router.post('/', express.json(), requireAuth, asyncHandler(async (req, res) => {
  const { type, title, description, category, pricePaise, licenseType, rentalDays, previewUrl, fileUrl } = req.body;
  if (!type || !title || !category || !pricePaise) {
    return res.status(400).json({ error: 'type, title, category and pricePaise are required' });
  }
  if (licenseType === 'time_limited' && !rentalDays) {
    return res.status(400).json({ error: 'rentalDays is required for a time-limited rental' });
  }

  const result = await pool.query(
    `INSERT INTO listings (seller_id, type, title, description, category, price_paise, license_type, rental_days, preview_url, file_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [req.userId, type, title, description, category, pricePaise, licenseType || 'single_use', rentalDays || null, previewUrl || null, fileUrl || null]
  );
  res.status(201).json(result.rows[0]);
}));

// POST /api/listings/:id/purchase-order — creates a real Razorpay order for this listing
router.post('/:id/purchase-order', express.json(), requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const listingResult = await pool.query('SELECT * FROM listings WHERE id = $1 AND status = $2', [id, 'active']);
  const listing = listingResult.rows[0];
  if (!listing) return res.status(404).json({ error: 'Listing not found or no longer available' });
  if (listing.seller_id === req.userId) return res.status(400).json({ error: "You can't buy your own listing" });

  let order;
  try {
    order = await razorpay.orders.create({
      amount: listing.price_paise,
      currency: 'INR',
      receipt: `listing_${listing.id}_${Date.now()}`,
      notes: { listingId: listing.id, purpose: 'listing_purchase' },
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Razorpay rejected the request — check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      razorpayError: err.error?.description || err.message,
    });
  }

  const purchase = await pool.query(
    `INSERT INTO listing_purchases (listing_id, buyer_id, amount_paise, razorpay_order_id, status)
     VALUES ($1, $2, $3, $4, 'created') RETURNING id`,
    [listing.id, req.userId, listing.price_paise, order.id]
  );

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    purchaseId: purchase.rows[0].id,
  });
}));

// POST /api/listings/verify — confirm payment, pay the seller instantly, unlock delivery
router.post('/verify', express.json(), requireAuth, asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  const purchaseResult = await pool.query('SELECT * FROM listing_purchases WHERE razorpay_order_id = $1', [razorpay_order_id]);
  const purchase = purchaseResult.rows[0];
  if (!purchase) return res.status(404).json({ error: 'Purchase record not found' });

  const listingResult = await pool.query('SELECT * FROM listings WHERE id = $1', [purchase.listing_id]);
  const listing = listingResult.rows[0];

  const expiresAt = listing.license_type === 'time_limited'
    ? new Date(Date.now() + listing.rental_days * 24 * 60 * 60 * 1000)
    : null;

  await pool.query('BEGIN');
  try {
    await pool.query(
      `UPDATE listing_purchases SET status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2, expires_at = $3
       WHERE id = $4`,
      [razorpay_payment_id, razorpay_signature, expiresAt, purchase.id]
    );
    // Instant payout to the seller — no approval step, this is a direct sale.
    await pool.query(
      `INSERT INTO wallets (user_id, balance_paise) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET balance_paise = wallets.balance_paise + $2, updated_at = now()`,
      [listing.seller_id, listing.price_paise]
    );
    await pool.query(
      `INSERT INTO payments (user_id, type, amount_paise, status) VALUES ($1, 'escrow_release', $2, 'paid')`,
      [listing.seller_id, listing.price_paise]
    );
    await pool.query(
      `INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)`,
      [listing.seller_id, 'Listing sold', `"${listing.title}" sold for ₹${(listing.price_paise/100).toLocaleString('en-IN')}.`]
    );
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }

  res.json({ verified: true });
}));

// GET /api/listings/mine/library — everything the logged-in user has bought,
// with the real file_url unlocked and rental expiry status computed.
router.get('/mine/library', requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT p.id as purchase_id, p.status, p.expires_at, p.created_at as purchased_at,
            l.title, l.description, l.category, l.license_type, l.preview_url, l.file_url,
            u.name as seller_name
     FROM listing_purchases p
     JOIN listings l ON l.id = p.listing_id
     JOIN users u ON u.id = l.seller_id
     WHERE p.buyer_id = $1 AND p.status = 'paid'
     ORDER BY p.created_at DESC`,
    [req.userId]
  );
  const items = result.rows.map(row => ({
    ...row,
    active: !row.expires_at || new Date(row.expires_at) > new Date(),
  }));
  res.json(items);
}));

// GET /api/listings/mine/selling — the logged-in user's own listings + sales count
router.get('/mine/selling', requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT l.*,
            (SELECT COUNT(*) FROM listing_purchases WHERE listing_id = l.id AND status = 'paid') as sales_count
     FROM listings l
     WHERE l.seller_id = $1
     ORDER BY l.created_at DESC`,
    [req.userId]
  );
  res.json(result.rows);
}));

module.exports = router;
