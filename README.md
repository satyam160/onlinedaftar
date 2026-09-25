# OnlineDaftar

A gig-task marketplace for India — post small paid tasks, workers complete them, escrow-protected payments via Razorpay, and secure authentication by Username & Password.

---

## Architecture & Structure

```
onlinedaftar/
├── src/                      ← React 18 frontend (Vite SPA)
│   ├── components/
│   │   ├── auth/             ← Username/Password sign in & registration
│   │   ├── layout/           ← Sidebar, Topbar, Role Switcher
│   │   ├── tasks/            ← BrowseTasks, PostTask, MyTasks
│   │   ├── dashboard/        ← OverviewTab, metrics & ledger summary
│   │   ├── wallet/           ← Passbook ledger & UPI withdrawal
│   │   ├── videomarket/      ← Creator footage marketplace
│   │   └── modals/           ← Proof submission & Escrow payment modal
│   ├── context/              ← AuthContext & AppContext
│   └── services/api.js       ← Centralized REST API client & offline demo fallback
├── backend/                  ← Node.js + Express + PostgreSQL API
│   ├── server.js             ← Express app & route mounting
│   ├── routes/
│   │   ├── auth.js           ← Username/password bcrypt login, registration & profile
│   │   ├── tasks.js          ← Gig lifecycle (create, accept, submit, approve)
│   │   ├── payments.js       ← Razorpay escrow orders & verification
│   │   ├── wallet.js         ← User balances & transaction records
│   │   └── bankaccount.js    ← RazorpayX payout accounts (UPI / Bank)
│   ├── db/                   ← PostgreSQL schema & migrations
│   └── middleware/           ← JWT authentication & async handlers
├── vercel.json               ← Vercel deployment configuration
└── vite.config.js            ← Vite build configuration
```

---

## Quick Start

### 1. Frontend (React + Vite)
```bash
npm install
npm run dev
```
Runs on `http://localhost:3000`.

### 2. Backend (Node + Express + PostgreSQL)
```bash
cd backend
npm install
npm run migrate  # runs schema.sql against your DATABASE_URL
npm run dev      # runs on http://localhost:4000
```
