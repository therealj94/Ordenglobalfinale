# Veta Wallet API

Backend for Veta Wallet — an internal-balance ("Veta Credits") wallet app for
the Orden Global ecosystem. **It has no identity system, no passwords, and no
user registration of its own.** Every login is a real-time, server-to-server
call to GENESIS ID, the ecosystem's shared identity provider.

## How authentication works

```
Veta Wallet frontend          Veta Wallet backend              GENESIS ID
       │                              │                             │
       │  POST /api/auth/login        │                             │
       │  { email, password }         │                             │
       ├─────────────────────────────►│                             │
       │                              │  POST /api/auth/login       │
       │                              │  (server-to-server)          │
       │                              ├────────────────────────────►│
       │                              │◄──── accessToken, user ─────┤
       │                              │                             │
       │                              │  POST /api/apps/user-status │
       │                              │  (X-API-Key)                 │
       │                              ├────────────────────────────►│
       │                              │◄──── verified, gid ─────────┤
       │                              │                             │
       │                              │  upsert local WalletUser,   │
       │                              │  issue Veta Wallet's own JWT │
       │◄──── { token, walletUser } ──┤                             │
```

No password is ever sent from Veta Wallet's frontend to GENESIS ID directly —
it always goes through Veta Wallet's own backend first, so there's no CORS
exposure and GENESIS ID never needs to know Veta Wallet's frontend origin.

A brand-new `WalletUser` row is created on first login (linked by GENESIS
ID's `gid`), with a 1,000 VC welcome bonus. Returning users just get their
existing balance.

## Setup

```bash
createdb veta_wallet_db   # or: psql -c "CREATE DATABASE veta_wallet_db;"

npm install
cp .env.example .env
```

Edit `.env`:
- `GENESIS_API_KEY` — from GENESIS ID admin: **Settings → Connect New App**
  (appName must be exactly `veta-wallet`)
- `DB_*` — your local Postgres credentials
- `JWT_SECRET` — any long random string, independent from GENESIS ID's own

```bash
npm run migrate
npm run dev   # http://localhost:4000
```

## API

### `POST /api/auth/login`
`{ email, password }` — the user's **GENESIS ID** credentials. Returns
`{ token, walletUser }`. Fails with whatever GENESIS ID returns (401 wrong
credentials, 403 not verified) or with 403 if `/api/apps/user-status`
doesn't independently confirm verification.

### `GET /api/wallet/me`
`Authorization: Bearer <veta-wallet-token>` — current balance + profile.

### `POST /api/wallet/transfer`
`{ toGid, amount, description? }` — moves credits between two Veta Wallet
users (both must have logged in at least once). Atomic (single DB
transaction), rejects insufficient balance and self-transfers.

### `GET /api/wallet/transactions`
Paginated history (`?page=&limit=`), both sent and received.

## Notes

- **VC (Veta Credits) are not real currency** — this is an internal ledger
  for the ecosystem demo/MVP, not connected to any bank or blockchain.
- Deploying this alongside GENESIS ID: it's a **separate service** with its
  own database — needs its own Render (or similar) web service + Postgres,
  same pattern as GENESIS ID's own `render.yaml`.
