# GENESIS ID - Verification Engine & Ecosystem SSO

Orden Global's own identity verification platform. One registration, one verification, access to the entire ecosystem (Veta Wallet, My Token Pay, and more).

## 🎯 Overview

GENESIS ID **is** the verification engine — it does not proxy to Veriff or any
other third-party provider. Facial liveness capture (5-angle guided rotation),
document capture (ID front/back, driver's license front/back, or passport),
storage, and review all happen inside GENESIS ID itself. See
[VERIFICATION_ENGINE.md](./VERIFICATION_ENGINE.md) for how the decision
pipeline works today (manual review) and how it's designed to grow (automated
in-house checks later, without breaking the API).

Once verified, users get a permanent **GENESIS ID (GID)** — e.g.
`GID-85m856-hnd` — plus JWT-based SSO across every connected Orden Global app.

## ✨ Key Features

- **In-house facial + document verification** — no external verification API. Both the selfie angles and the ID/passport photos **auto-capture** from the camera (no shutter button), with manual capture and file upload as fallbacks
- **Password reset by email**: secure single-use token (hashed at rest, 1-hour expiry)
- **GENESIS ID (GID)**: permanent cross-ecosystem identifier assigned on approval, format `GID-<5 digits + letter>-<nationality alpha-3>`
- **Automatic quality gate**: clear photos get approved instantly (with a documented, honest scope — see VERIFICATION_ENGINE.md); anything unclear after 3 attempts goes to manual review
- **Central SSO**: Single Sign-On across all Orden Global applications
- **JWT Authentication**: Secure, stateless token-based authentication
- **Admin Dashboard**: Full web UI — users, verifications with document viewer, manual review queue, reports, connected-app API keys
- **KYC SDK**: framework-agnostic widget so any app (Veta Wallet, My Token Pay, or a future one) can drop in the verification flow
- **Audit Logs**: Full compliance and audit trail
- **CORS & Security**: Helmet, per-app API keys, role-gated admin routes

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       GENESIS ID Core                        │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Auth API    │  │  KYC API     │  │  App API             │ │
│  │ • Register   │  │ • Submit KYC │  │ • User status        │ │
│  │ • Login      │  │ • Status     │  │ • Register app       │ │
│  │ • Refresh    │  │              │  │ • Token validate     │ │
│  └──────────────┘  └──────────────┘  └─────────────────────┘ │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Admin API: Users · Verifications · Manual Review ·     │  │
│  │             Connected Apps (API keys) · Reports · Logs  │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              AWS RDS PostgreSQL Database                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         ↑                                    ↑
  apps/web (Next.js)                  packages/kyc-sdk
  Frontend + Admin UI            Widget for Veta Wallet, etc.
```

## 🚀 Quick Start

See **[QUICK_START.md](./QUICK_START.md)** for a full walkthrough (backend + frontend + database), or the summary below.

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### Backend

```bash
git clone https://github.com/therealj94/ordenglobalfinale.git
cd ordenglobalfinale

npm install
cp .env.example .env        # edit with your DB/JWT settings
npm run migrate
npm run seed                # creates the first admin user
npm run dev                 # http://localhost:3000
```

### Frontend

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3001
```

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Step-by-step local setup
- **[VERIFICATION_ENGINE.md](./VERIFICATION_ENGINE.md)** - How GENESIS ID's own verification pipeline works
- **[API.md](./API.md)** - Complete API endpoint reference
- **[INTEGRATION.md](./INTEGRATION.md)** - Running the full ecosystem locally
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - AWS RDS, ECS, ALB, Route 53
- **[packages/kyc-sdk/README.md](./packages/kyc-sdk/README.md)** - How other apps (Veta Wallet, My Token Pay) integrate

## 🔌 API Endpoints (summary — see API.md for full reference)

### Authentication
- `POST /api/auth/register` - Register new user (returns an onboarding token)
- `POST /api/auth/login` - Login (requires `status: verified`)
- `GET  /api/auth/me` - Current user profile
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request a password reset link by email
- `POST /api/auth/reset-password` - Set a new password with the emailed token

### KYC
- `POST /api/kyc/submit` - Submit facial + document capture for review
- `GET  /api/kyc/status/:userId` - Check verification status

### App Integration (requires `X-API-Key`)
- `POST /api/apps/user-status` - Check if user exists and is verified
- `POST /api/apps/register-app` - Link app to user account
- `POST /api/apps/token-validate` - Validate a user's JWT

### Admin (requires admin role)
- `/api/admin/users`, `/api/admin/verifications`, `/api/admin/manual-reviews`
- `/api/admin/apps` - Create/list/revoke connected-app API keys
- `/api/admin/reports`, `/api/admin/logs`

## 🗄️ Database Models

- **User** - accounts, profiles, role (`user`/`admin`)
- **Verification** - facial + document capture, status, review mode
- **ManualReviewCase** - one per verification pending human review
- **ConnectedApp** - ecosystem apps and their API keys
- **LoginToken** - JWT/refresh token tracking
- **AppRegistration** - which apps a user has linked
- **AdminLog** - audit trail

## 🔐 Security Features

- **Password Hashing**: bcryptjs, salt rounds 10
- **JWT**: HS256, short-lived onboarding tokens for pre-verification users
- **Per-app API keys**: `X-API-Key` required on every `/api/apps/*` call
- **Role-gated admin routes**: `adminMiddleware` checks `role === 'admin'` fresh from the DB on every request
- **CORS**: configured for specific origins only
- **Helmet**: security headers
- **Input Validation**: express-validator on all write endpoints

## 🔄 User Flow

```
1. User visits app (Veta Wallet, etc.)
   ↓
2. App opens the GenesisKYC widget (or redirects) if not verified
   ↓
3. User registers on GENESIS ID (email + password) → onboarding token
   ↓
4. Facial capture: 5 guided angles (straight, left, right, up, down)
   ↓
5. Document capture: ID front+back / license front+back / passport page
   ↓
6. POST /api/kyc/submit → ManualReviewCase created
   ↓
7. Admin reviews the photos in /admin/reviews → approve or reject
   ↓
8. User logs in → gets JWT → SSO across all Orden Global apps
```

## 📊 Admin Panel

- **Dashboard**: real-time stats + charts (verification trend, status split)
- **Users**: search, filter, paginate, deactivate
- **Verifications**: full list + document/selfie viewer per case
- **Manual Reviews**: approve/reject queue with notes and email notification
- **Settings**: create/revoke API keys for connected apps
- **Reports**: daily stats + audit log feed

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js 18+, Express |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Database | PostgreSQL 14+ (AWS RDS), Sequelize |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Charts | Recharts |
| Validation | express-validator |
| Security | Helmet, CORS, per-app API keys |
| Logging | Morgan |

## 📦 Project Structure

```
Ordenglobalfinale/
├── src/                        # Backend (Express)
│   ├── app.js
│   ├── config/database.js
│   ├── controllers/            # Auth, KYC, App, Admin
│   ├── models/                 # Sequelize models
│   ├── routes/
│   ├── services/                # JWT, Password, Email
│   └── middleware/               # auth, admin, per-app API key
├── database/
│   ├── migrations/
│   └── seeders/                 # creates the first admin user
├── apps/
│   └── web/                     # Next.js frontend + admin dashboard
├── packages/
│   └── kyc-sdk/                 # Widget + integration guide for Veta Wallet, etc.
├── package.json
└── .env.example
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md). Summary: RDS PostgreSQL → ECR image →
ECS Fargate → ALB → Route 53 → ACM certificate.

## 🧪 Testing

```bash
npm test
curl http://localhost:3000/health
```

## 🔄 Connecting a New App

1. Admin creates the app in **Settings → Connect New App**, gets an API key
2. App's frontend drops in the `packages/kyc-sdk` widget to trigger verification
3. App's backend confirms status server-to-server via `POST /api/apps/user-status` (with `X-API-Key`)
4. App links the account via `POST /api/apps/register-app`

Full guide: [packages/kyc-sdk/README.md](./packages/kyc-sdk/README.md)

## 📝 Environment Variables

See `.env.example`. Key variables:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` - Database connection
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Token signing keys
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` - used by `npm run seed` to create the first admin
- `CORS_ORIGIN` - Allowed origin domains
- `NODE_ENV` - Environment (development/production)

## 🤝 Contributing

1. Create a feature branch
2. Make changes and commit with clear messages
3. Push to origin
4. Create a Pull Request

## 📄 License

MIT

## 🆘 Support

- GitHub Issues
- Email: dev@orden-global.com
- Slack: #genesis-id

## 🎯 Roadmap

- [x] Admin dashboard (Next.js)
- [x] KYC SDK for ecosystem apps
- [ ] Automated document/liveness analysis (see VERIFICATION_ENGINE.md)
- [x] Rate limiting on auth endpoints
- [ ] Two-factor authentication (2FA)
- [ ] Advanced analytics and reporting
- [ ] Compliance certifications (ISO 27001, SOC 2)

---

**GENESIS ID** - The verification engine for the Orden Global Ecosystem 🚀
