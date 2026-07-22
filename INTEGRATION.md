# GENESIS ID - Complete Integration Guide

This guide explains how to run the complete GENESIS ID ecosystem locally: backend, frontend, and connected apps. GENESIS ID is fully self-contained — there is no third-party verification provider to configure.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GENESIS ID Platform                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐        ┌──────────────────┐                 │
│  │  Frontend        │        │  Backend         │                 │
│  │  (Next.js)       │◄─────► │  (Express)       │                 │
│  │  :3001           │        │  :3000           │                 │
│  │  incl. own       │        │  incl. own       │                 │
│  │  facial+doc      │        │  KYC storage +   │                 │
│  │  capture UI      │        │  manual review    │                 │
│  └──────────────────┘        └──────────────────┘                 │
│       │                              │                             │
│       │                              ▼                             │
│       │                      ┌──────────────────┐                 │
│       │                      │  PostgreSQL      │                 │
│       │                      │  (AWS RDS)       │                 │
│       │                      └──────────────────┘                 │
│       │                                                             │
│       └──────────────────┬──────────────────────────────────────┐  │
│                          ▼                                       │  │
│  ┌───────────────────────────────────────────────────────────┐ │  │
│  │  Ecosystem Apps (integrate via packages/kyc-sdk):         │ │  │
│  │  - Veta Wallet      (:3002)                               │ │  │
│  │  - My Token Pay     (:3003)                               │ │  │
│  │  - Other apps...                                          │ │  │
│  └───────────────────────────────────────────────────────────┘ │  │
│                                                                 │  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start (Local Development)

### Phase 1: Setup Database

```bash
docker run --name genesis-id-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=genesis_id_db \
  -p 5432:5432 \
  -d postgres:14-alpine

# Or if PostgreSQL is installed locally:
createdb genesis_id_db
```

### Phase 2: Backend Setup

```bash
cd /path/to/Ordenglobalfinale

npm install
cp .env.example .env

# Edit .env with your settings:
# - DB_HOST=localhost, DB_USER=postgres, DB_PASSWORD=localdevpassword
# - JWT_SECRET=your_random_secret_key_here
# - ADMIN_EMAIL / ADMIN_PASSWORD (used by the seeder below)

npm run migrate
npm run seed        # creates the first admin user
npm run dev
# Backend runs on http://localhost:3000
```

### Phase 3: Frontend Setup

```bash
cd apps/web

npm install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000/api

npm run dev
# Frontend runs on http://localhost:3001
```

Now you have:
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **API**: http://localhost:3000/api

## 📋 Complete Local Setup Checklist

```bash
✅ PostgreSQL running (localhost:5432)
✅ Backend running (localhost:3000)
✅ Frontend running (localhost:3001)
✅ .env configured with DB credentials + JWT secrets
✅ Database migrations executed
✅ Admin user seeded (npm run seed)
✅ Can access http://localhost:3001 in browser
```

## 🔄 User Registration & Verification Flow (Local Testing)

### Step 1: Register
1. Open http://localhost:3001 → "Get Started" → Register
2. Fill form with email, password, name
3. Backend creates the user (`status: pending`) and returns a short-lived **onboarding token**

### Step 2: KYC (GENESIS ID's own capture flow)
1. Redirected to `/verify?userId={userId}`
2. **Facial capture**: live camera, 5 guided angles (straight, left, right, up, down) for liveness
3. **Document capture**: select Passport / ID Card / Driver's License, capture front (+ back for ID/license) via camera or upload
4. `POST /api/kyc/submit` stores the images and creates a `ManualReviewCase`

### Step 3: Manual Review (admin side)
1. Admin opens `/admin/reviews`, sees the case with the submitted photos
2. Approves or rejects, with optional notes
3. User's status updates to `verified` (or `rejected`), and gets an email notification

### Step 4: Login & Access
1. Once verified, the user logs in normally (email/password) → gets a real JWT
2. Token stored in localStorage, used for `/dashboard` and ecosystem apps

## 👨‍💼 Admin Testing

### Access Admin Panel
1. Navigate to http://localhost:3001/auth/login, log in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`
2. You'll land on `/admin` with:
   - **Dashboard**: stats + charts
   - **Users**: search/filter/paginate/deactivate
   - **Verifications**: full list + document/selfie viewer
   - **Manual Reviews**: pending queue
   - **Settings**: create/revoke connected-app API keys
   - **Reports**: trends + audit log

### Test Manual Review End-to-End
1. Register a test user and complete the KYC capture flow
2. Go to Admin → Manual Reviews → select the case
3. Add review notes, click Approve or Reject
4. Confirm the user's status updated and (if email is configured) they were notified

## 🗄️ Database Queries (Postgres)

```sql
psql -U postgres -d genesis_id_db

-- View users
SELECT id, email, status, role, created_at FROM "Users" LIMIT 10;

-- View verifications (excluding large image columns)
SELECT id, user_id, status, document_type, review_mode, created_at
FROM "Verifications" WHERE status = 'pending';

-- View pending manual review cases
SELECT * FROM "ManualReviewCases" WHERE status = 'pending';

-- View connected apps
SELECT app_name, is_active, last_used_at FROM "ConnectedApps";

-- View login tokens
SELECT user_id, expires_at, revoked_at FROM "LoginTokens" ORDER BY created_at DESC;

-- View admin logs
SELECT * FROM "AdminLogs" ORDER BY created_at DESC LIMIT 20;
```

## 🐛 Troubleshooting

### Issue: "Connection refused" on port 5432
```
Solution: PostgreSQL not running
- Start PostgreSQL: brew services start postgresql (Mac)
- Or use Docker (see Phase 1 above)
```

### Issue: "Cannot find module" in frontend
```
Solution: cd apps/web && npm install
```

### Issue: "API not responding"
```
Solution: curl http://localhost:3000/health
- Run backend: npm run dev (from root directory)
```

### Issue: Camera doesn't start / capture button never enables
```
Solution: Check browser camera permissions (allow the site to use the camera).
The capture buttons are disabled until the video stream reports real
dimensions — if this never happens, check the browser console for
getUserMedia errors.
```

### Issue: "Token invalid/expired"
```
Solution: localStorage.clear() then log in again.
Check JWT_SECRET and JWT_REFRESH_SECRET in the backend .env.
```

## 🔐 Security Notes for Local Testing

**DO NOT use these for production:**
- Simple/dev JWT secrets (use strong random strings in production)
- HTTP localhost (use HTTPS in production)
- CORS open to localhost (restrict to real domains in production)
- Document/selfie images stored as base64 in Postgres (fine for now — move to S3/object storage before scaling, see DEPLOYMENT.md)

## 📊 Testing Different Scenarios

### Test 1: Happy Path (Approved)
1. Register → complete KYC capture → admin approves → user logs in

### Test 2: Rejected
1. Register → complete KYC capture → admin rejects with notes → user sees the reason and can retry

### Test 3: Connected App Flow
1. Admin creates an app in Settings (e.g. `veta-wallet`), copies the API key
2. `curl -X POST http://localhost:3000/api/apps/user-status -H "X-API-Key: <key>" -H "Content-Type: application/json" -d '{"userId":"<uuid>","appName":"veta-wallet"}'`
3. Confirm it returns `verified: true` only for a genuinely verified user, and `401` without the key

## 🚀 Connecting Ecosystem Apps

Once GENESIS ID is running, connect Veta Wallet, My Token Pay, or any other app:

1. **Admin panel**: Settings → Connect New App → get an API key
2. **App frontend**: drop in `packages/kyc-sdk/genesis-kyc-sdk.js` (or the React wrapper), call `GenesisKYC.verify({ userId, appName, onComplete })`
3. **App backend**: confirm status server-to-server with the API key (`packages/kyc-sdk/server-examples/`)

Full guide: [packages/kyc-sdk/README.md](./packages/kyc-sdk/README.md)

### Veta Wallet — the first connected app

Veta Wallet (`apps/veta-wallet-mobile/`) is an Expo/React Native app with no
identity system of its own — it calls GENESIS ID's API directly:

- `POST /auth/register` and `POST /auth/login` for account creation/sign-in
  (`src/api.js`, used from `src/screens/Auth.js`); no CORS concern since it's
  a native app, not a browser.
- `POST /auth/forgot-password` for password resets.
- GENESIS ID's own hosted `/embed/verify` page (via `expo-web-browser`) for
  the actual KYC capture — facial + document + AML — instead of
  reimplementing that natively (`src/screens/Onboard.js`'s `Kyc` screen).

```bash
cd apps/veta-wallet-mobile
npm install
npm start                # then open in Expo Go, an emulator, or a dev build
```

Point it at a local backend instead of the production API by setting
`EXPO_PUBLIC_GENESIS_API_URL` (e.g. your machine's LAN IP or
`http://10.0.2.2:3000/api` for the Android emulator — "localhost" from a
phone/emulator refers to the device itself) and `EXPO_PUBLIC_GENESIS_APP_URL`.

## 📈 Next Steps

1. **Deploy Backend** (AWS RDS + ECS) — see DEPLOYMENT.md
2. **Deploy Frontend** (Vercel, Netlify, or S3+CloudFront)
3. **Move document/selfie storage to S3** instead of Postgres base64
4. **Connect Production Apps** — real API keys, real redirect URLs, CORS updated
5. **Monitoring**: CloudWatch, Sentry, or similar

## 📝 Environment Variables Reference

### Backend (.env)
```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=genesis_id_db
DB_USER=postgres
DB_PASSWORD=localdevpassword

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Admin (used by npm run seed)
ADMIN_EMAIL=admin@ordenglobal.com
ADMIN_PASSWORD=change_this

# Frontend URLs
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:3003
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
```

## ✅ Production Checklist

- [ ] Database: AWS RDS PostgreSQL configured
- [ ] Backend: ECS deployed on AWS
- [ ] Frontend: Vercel/Netlify deployed
- [ ] Document/selfie storage moved to S3 (not Postgres base64)
- [ ] SSL/TLS: Valid certificates installed
- [ ] Backups: Database backup strategy in place
- [ ] Monitoring: CloudWatch/Sentry configured
- [ ] Security: All secrets in AWS Secrets Manager
- [ ] CORS: Production domains configured
- [ ] Rate limiting: Implemented on backend
- [ ] Email: SendGrid or similar configured
- [ ] DNS: Route 53 records created

## 📚 Additional Documentation

- Backend API: `API.md`
- Verification engine details: `VERIFICATION_ENGINE.md`
- Deployment: `DEPLOYMENT.md`
- Frontend: `apps/web/README.md`
- Ecosystem app integration: `packages/kyc-sdk/README.md`

## 🆘 Support

1. Check logs: `docker logs genesis-id-postgres`
2. Check console: Browser DevTools → Console
3. Check backend: `curl http://localhost:3000/health`
4. Check database: `psql -U postgres -d genesis_id_db`

---

**Ready to test?** Start with Phase 1: Setup Database above! 🚀
