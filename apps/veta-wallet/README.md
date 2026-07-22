# Veta Wallet (frontend)

Next.js frontend for Veta Wallet. Logs in with a **GENESIS ID** email/password
(there's no separate Veta Wallet account) and talks to `services/veta-wallet-api`
for everything else — balance, sending credits, transaction history.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev   # http://localhost:3002
```

Requires `services/veta-wallet-api` running (default `http://localhost:4000`)
and a verified GENESIS ID account to log in with.

## Pages

- `/login` — GENESIS ID email/password
- `/dashboard` — balance, GID, quick actions
- `/send` — send credits to any other GID
- `/transactions` — history

## Environment variables

- `NEXT_PUBLIC_WALLET_API_URL` — Veta Wallet's own backend
- `NEXT_PUBLIC_GENESIS_APP_URL` — GENESIS ID's frontend, used only for the
  "create an account" / "finish verification" links on the login page
