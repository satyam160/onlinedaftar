-- OnlineDaftar database schema (PostgreSQL)
-- Run with: npm run migrate

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'worker', -- 'worker' | 'poster' | 'both'
  kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
  upi_id TEXT,
  bank_account_last4 TEXT,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT has_contact_method CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance_paise BIGINT NOT NULL DEFAULT 0, -- always store money as integer paise, never float
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  pay_paise BIGINT NOT NULL,
  proof_type TEXT NOT NULL DEFAULT 'photo', -- 'photo' | 'file' | 'link' | 'none'
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'open' | 'accepted' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
  escrow_payment_id UUID,
  assigned_worker_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id),
  proof_url TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Every rupee that moves through the platform is a row here.
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  type TEXT NOT NULL, -- 'escrow_fund' | 'escrow_release' | 'withdrawal' | 'refund'
  amount_paise BIGINT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT NOT NULL DEFAULT 'created', -- 'created' | 'paid' | 'failed' | 'refunded'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP codes for mobile/email login. We store a HASH of the code, never
-- the raw code, and every code expires — same pattern real banks use.
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,        -- phone number or email being verified
  method TEXT NOT NULL,            -- 'mobile' | 'email'
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_identifier ON otp_codes(identifier, consumed);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read);
