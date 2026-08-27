# OnlineDaftar

A gig-task marketplace for India — post small paid tasks, workers complete
them, escrow-protected payments via Razorpay, OTP login by mobile/email.

## Structure

```
onlinedaftar/
├── index.html       ← the frontend (open this in a browser)
└── backend/          ← the Node.js + Express + PostgreSQL API
    ├── server.js
    ├── routes/
    ├── db/
    └── README.md      ← full backend setup instructions
```

## Quick start

1. See `backend/README.md` for full backend setup (database, Razorpay keys, etc.)
2. Once the backend is running (`npm run dev` inside `backend/`), open
   `index.html` directly in your browser — it's already configured to
   talk to `http://localhost:4000`.

## Note on secrets

`backend/.env` is intentionally **not** included in this repo (see
`backend/.gitignore`) — it holds your real Razorpay keys and database URL.
After cloning this repo, copy `backend/.env.example` to `backend/.env` and
fill in your own values.
