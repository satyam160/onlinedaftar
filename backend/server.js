require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const otpRoutes = require('./routes/otp');
const taskRoutes = require('./routes/tasks');
const paymentRoutes = require('./routes/payments');
const walletRoutes = require('./routes/wallet');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// NOTE: the Razorpay webhook route needs the raw request body to verify
// its signature, so it registers its own express.raw() middleware inside
// routes/payments.js — do NOT put a global express.json() before that
// route, or the signature check will fail. Ordering below handles this
// by applying express.json() only to routes that need it.
app.use('/api/auth', express.json(), authRoutes);
app.use('/api/otp', express.json(), otpRoutes);
app.use('/api/tasks', express.json(), taskRoutes);
app.use('/api/wallet', express.json(), walletRoutes);
app.use('/api/payments', paymentRoutes); // payments.js applies json/raw per-route

app.get('/health', (req, res) => res.json({ ok: true }));

// Global error handler — this is what asyncHandler forwards errors to.
// Without this, an unhandled error can still crash the whole process.
// With it, every failed request gets a clean JSON response instead.
app.use((err, req, res, next) => {
  console.error('Request error:', err);
  res.status(500).json({ error: err.message || 'Something went wrong on the server.' });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection (this should be rare now):', err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`OnlineDaftar API running on http://localhost:${PORT}`);
});
