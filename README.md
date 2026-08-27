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



## Note on secrets

`backend/.env` is intentionally **not** included in this repo (see
`backend/.gitignore`) — it holds real Razorpay keys and database URL.

