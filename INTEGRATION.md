# GENESIS ID - Complete Integration Guide

This guide explains how to run the complete GENESIS ID ecosystem locally with backend, frontend, and Veriff integration.

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
│                  ┌────────────────────┐                         │  │
│                  │  Veriff.com        │                         │  │
│                  │  (Facial Verif.)   │                         │  │
│                  └────────────────────┘                         │  │
│                                                                 │  │
│  ┌───────────────────────────────────────────────────────────┐ │  │
│  │  Ecosystem Apps:                                          │ │  │
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
# Install PostgreSQL locally (or use Docker)
docker run --name genesis-id-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=genesis_id_db \
  -p 5432:5432 \
  -d postgres:14-alpine

# Or if PostgreSQL is installed locally:
createdb genesis_id_db
psql -U postgres -d genesis_id_db
```

### Phase 2: Backend Setup

```bash
# Navigate to root (where package.json with backend is)
cd /path/to/Ordenglobalfinale

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings:
# - DB_HOST=localhost (for local), DB_USER=postgres, DB_PASSWORD=localdevpassword
# - JWT_SECRET=your_random_secret_key_here
# - VERIFF_API_KEY=your_veriff_premium_key
# - VERIFF_SECRET=your_veriff_secret
# - VERIFF_CALLBACK_URL=http://localhost:3000/api/auth/verify-callback

# Run migrations
npm run migrate

# Start backend
npm run dev
# Backend runs on http://localhost:3000
```

### Phase 3: Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd apps/web

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Edit .env.local:
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_VERIFF_URL=https://station.veriff.com
NODE_ENV=development

# Start frontend
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
✅ .env configured with DB credentials
✅ .env configured with JWT secrets
✅ .env configured with Veriff API keys
✅ Database migrations executed
✅ Can access http://localhost:3001 in browser
```

## 🔄 User Registration & Verification Flow (Local Testing)

### Step 1: Register
1. Open http://localhost:3001
2. Click "Get Started" → Register
3. Fill form with email, password, name
4. Backend creates user in PostgreSQL

### Step 2: KYC/Verification
1. Redirected to `/verify?userId={userId}`
2. Click "Start Verification"
3. Redirected to Veriff Station
4. Complete facial verification and document upload

### Step 3: Webhook Callback
1. Veriff sends decision to `http://localhost:3000/api/auth/verify-callback`
2. Backend updates user status in DB
3. Frontend receives JWT tokens
4. User redirected to `/dashboard`

### Step 4: Access Dashboard
1. User sees verified status
2. Can view verification details
3. Token stored in localStorage

## 👨‍💼 Admin Testing

### Access Admin Panel
1. Navigate to http://localhost:3001/admin
2. Login with admin credentials
3. View:
   - **Dashboard**: Stats and analytics
   - **Users**: List all registered users
   - **Verifications**: View all verifications
   - **Manual Reviews**: Cases pending manual review
   - **Reports**: Trends and analytics

### Test Manual Review
1. Register a user that will go to "pending" status
2. Go to Admin → Manual Reviews
3. Select case
4. Add review notes
5. Click "Approve" or "Reject"
6. Status updates in database
7. User receives email notification

## 🔌 Veriff Integration (Local/Sandbox)

### Veriff Sandbox Mode
Veriff provides a sandbox for testing without real video:

```bash
# In .env:
VERIFF_API_URL=https://stationapi.veriff.com  # Use this for testing
# Production: https://api.veriff.com
```

### Test Veriff Locally
1. Create test Veriff account at https://station.veriff.com
2. Get API Key and Secret from Settings
3. Set in .env: VERIFF_API_KEY, VERIFF_SECRET
4. Start verification flow
5. Veriff SDK opens in browser
6. Complete test verification (or use test video)
7. Veriff sends webhook to your callback URL

### Mock Webhook (for testing without Veriff)
```bash
# Test webhook manually:
curl -X POST http://localhost:3000/api/auth/verify-callback \
  -H "Content-Type: application/json" \
  -d '{
    "verification": {
      "id": "test-session-123",
      "decision": "approved",
      "timestamp": '$(date +%s)',
      "person": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }'
```

## 🗄️ Database Queries (Postgres)

Check database directly:

```sql
-- Connect
psql -U postgres -d genesis_id_db

-- View users
SELECT id, email, status, created_at FROM "Users" LIMIT 10;

-- View verifications
SELECT * FROM "Verifications" WHERE status = 'pending';

-- View login tokens
SELECT user_id, expires_at, revoked_at FROM "LoginTokens" ORDER BY created_at DESC;

-- View admin logs
SELECT * FROM "AdminLogs" ORDER BY created_at DESC LIMIT 20;

-- Check verification sessions
SELECT user_id, status, expires_at FROM "VerificationSessions";
```

## 🐛 Troubleshooting

### Issue: "Connection refused" on port 5432
```
Solution: PostgreSQL not running
- Start PostgreSQL: brew services start postgresql (Mac)
- Or use Docker: docker run -d --name genesis-id-postgres ... (see above)
```

### Issue: "Cannot find module" in frontend
```
Solution: Dependencies not installed
- Run: cd apps/web && npm install
```

### Issue: "API not responding" 
```
Solution: Backend not running
- Check backend is running: curl http://localhost:3000/health
- Run backend: npm run dev (from root directory)
```

### Issue: "Veriff SDK not loading"
```
Solution: Check CORS or Veriff configuration
- Check browser console for errors
- Verify NEXT_PUBLIC_VERIFF_URL in .env.local
- Check CORS allowed origins in backend
```

### Issue: "Token invalid/expired"
```
Solution: Token refresh or manual re-login
- Clear localStorage: localStorage.clear()
- Login again
- Check JWT_SECRET and JWT_REFRESH_SECRET in backend .env
```

## 🔐 Security Notes for Local Testing

**DO NOT use these for production:**
- Keep default SQLite/local DB (use AWS RDS in production)
- Keep simple JWT secrets (use strong random strings in production)
- Allow HTTP localhost (use HTTPS in production)
- Open CORS to localhost (restrict in production)

## 📊 Testing Different Scenarios

### Test 1: Happy Path (Approved)
1. Register user
2. Start verification
3. Veriff approves → User gets JWT → Dashboard access

### Test 2: Pending Review
1. Register user
2. Start verification
3. Veriff sends "pending" → Admin reviews → Approves
4. User notified via email

### Test 3: Rejected
1. Register user
2. Start verification
3. Veriff rejects → User sees error
4. Can retry verification

### Test 4: Expired Session
1. Register user
2. Start verification
3. Wait 24 hours (or manually expire)
4. User can request new verification

## 🚀 Running Ecosystem Apps

Once GENESIS ID is working, connect other apps:

### Veta Wallet
```bash
# In separate terminal
cd path/to/veta-wallet
npm install
npm run dev
# Runs on :3002

# On page load, checks: POST /api/apps/user-status
# If not verified, redirects to GENESIS ID
# After verification, redirects back with JWT
```

### My Token Pay
```bash
# Similar setup
cd path/to/my-token-pay
npm install
npm run dev
# Runs on :3003
```

## 📈 Next Steps

After local testing works:

1. **Deploy Backend** (AWS RDS + ECS)
   - Follow DEPLOYMENT.md
   - Update .env with AWS resources
   - Deploy to production

2. **Deploy Frontend** (Vercel, Netlify, or AWS S3+CloudFront)
   - Update NEXT_PUBLIC_API_URL to production API
   - Deploy Next.js app

3. **Connect Production Apps**
   - Update app URLs in admin settings
   - Configure CORS for production domains
   - Test full ecosystem flow

4. **Setup Monitoring**
   - CloudWatch logs for backend
   - Vercel/Netlify analytics for frontend
   - Sentry for error tracking
   - Datadog for APM

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

# Veriff
VERIFF_API_KEY=your_api_key
VERIFF_SECRET=your_secret
VERIFF_API_URL=https://stationapi.veriff.com
VERIFF_CALLBACK_URL=http://localhost:3000/api/auth/verify-callback

# Frontend URLs
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:3003
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_VERIFF_URL=https://station.veriff.com
NODE_ENV=development
```

## ✅ Production Checklist

Before going live:
- [ ] Database: AWS RDS PostgreSQL configured
- [ ] Backend: ECS/Lambda deployed on AWS
- [ ] Frontend: Vercel/Netlify deployed
- [ ] Veriff: Production credentials configured
- [ ] SSL/TLS: Valid certificates installed
- [ ] Backups: Database backup strategy in place
- [ ] Monitoring: CloudWatch/Sentry configured
- [ ] Security: All secrets in AWS Secrets Manager
- [ ] CORS: Production domains configured
- [ ] Rate limiting: Implemented on backend
- [ ] Email: SendGrid or similar configured
- [ ] DNS: Route 53 records created
- [ ] CDN: CloudFront configured (optional)

## 🎯 Performance Optimization

### Backend
- Database connection pooling (Sequelize pool)
- Redis caching for tokens (optional)
- Request rate limiting
- Query optimization

### Frontend
- Next.js built-in optimizations
- Image optimization
- Code splitting
- Lazy loading components

## 📚 Additional Documentation

- Backend API: See `API.md`
- Veriff Integration: See `VERIFF_INTEGRATION.md`
- Deployment: See `DEPLOYMENT.md`
- Frontend: See `apps/web/README.md`

## 🆘 Support

For issues:
1. Check logs: `docker logs genesis-id-postgres`
2. Check console: Browser DevTools → Console
3. Check backend: `curl http://localhost:3000/health`
4. Check database: `psql -U postgres -d genesis_id_db`

---

**Ready to test?** Start with Phase 1: Setup Database above! 🚀
