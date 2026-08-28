# OnlineDaftar — Backend

Real, runnable Node.js + Express + PostgreSQL backend with genuine Razorpay
escrow integration and OTP login, matching the OnlineDaftar frontend.

## 1. Setup

```bash
npm install
cp .env.example .env
# now edit .env with your real DATABASE_URL and Razorpay TEST keys
npm run migrate   # creates all tables from db/schema.sql
npm run dev       # starts the API on http://localhost:4000
```

## 2. Getting your Razorpay test keys

1. Sign up free at https://dashboard.razorpay.com/signup (test mode needs no KYC)
2. Make sure you're in **Test Mode** (toggle top-right)
3. Settings → API Keys → Generate Test Key
4. Paste the Key ID + Key Secret into `.env`
5. Test card: `4111 1111 1111 1111`, any future expiry, any CVV

## 3. OTP login (mobile + email)

```
POST /api/otp/send    { identifier: "9876543210", method: "mobile" }
POST /api/otp/verify  { identifier: "9876543210", method: "mobile", code: "482913" }
```

Without `SMTP_HOST` / `TWILIO_ACCOUNT_SID` set, codes are just logged to
your server console — perfect for local testing.

## 4. Crash-proofing

Every route is wrapped in `asyncHandler` (see `middleware/asyncHandler.js`),
and `server.js` has a global error handler plus an `unhandledRejection`
safety net. This means a bad Razorpay key, a database hiccup, or any other
runtime error returns a clean JSON error response — it should never take
the whole server down anymore.

## 5. Connecting to a local file:// frontend

If you're opening the frontend HTML by double-clicking it (rather than
serving it from a real domain), your browser sends it as origin `null`.
Set `FRONTEND_URL=*` in `.env` for local testing so CORS doesn't block it.
Tighten this to your real domain once you deploy for real.

## 6. Before going live (real money, not test mode)

- Complete Razorpay KYC to switch from `rzp_test_...` to `rzp_live_...` keys
- Set up the webhook URL (`/api/payments/webhook`) in your Razorpay Dashboard
- Sending payouts to workers needs **RazorpayX** — a separate product/signup
- Tighten `FRONTEND_URL` to your real deployed domain, not `*`
- Add HTTPS, and get a professional compliance review (RBI Payment
  Aggregator rules + India's DPDP Act for storing phone/email/payment data)

## Folder structure

```
backend/
├── server.js
├── db/
│   ├── schema.sql
│   ├── pool.js
│   └── migrate.js
├── middleware/
│   ├── auth.js           # JWT verification
│   └── asyncHandler.js   # crash prevention
├── routes/
│   ├── auth.js
│   ├── otp.js
│   ├── tasks.js
│   ├── payments.js
│   └── wallet.js
├── .env.example
├── .gitignore
└── package.json
```
