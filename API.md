# GENESIS ID - API Documentation

## Overview
GENESIS ID es el motor propio de verificación de identidad (facial + documentos) del ecosistema Orden Global. No depende de ningún proveedor externo — la captura, el almacenamiento y la decisión (hoy manual, vía el panel admin) ocurren enteramente dentro de GENESIS ID. Los usuarios se registran una sola vez y acceden a todas las apps del ecosistema.

## Base URL
```
https://genesis-id.orden-global.com/api
```

## Authentication
Hay dos esquemas de autenticación distintos:

1. **Usuarios finales**: JWT en el header `Authorization: Bearer <access_token>` (o un `onboardingToken` de corta duración entre el registro y la primera verificación).
2. **Apps del ecosistema** (Veta Wallet, My Token Pay, etc.): API key en el header `X-API-Key: <key>`, emitida desde el panel admin (Settings → Connected Apps).

---

## Auth Endpoints

### 1. Register User
```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "uuid-here",
  "email": "user@example.com",
  "onboardingToken": "jwt-token-valid-2h"
}
```

`onboardingToken` authorizes completing KYC (`/kyc/submit`, `/kyc/status/:userId`) for this one `userId`, before the user has a full session.

### 2. Login
```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "verified",
    "role": "user"
  }
}
```

Fails with `403` if the user hasn't completed verification yet (`status !== 'verified'`).

### 3. Get Current User
```
GET /auth/me
Authorization: Bearer <access_token>
```

### 4. Refresh Token
```
POST /auth/refresh
```

**Request:**
```json
{ "refreshToken": "refresh-token" }
```

**Response:**
```json
{ "accessToken": "new-jwt-token" }
```

### 5. Logout
```
POST /auth/logout
Authorization: Bearer <access_token>
```

Revokes the current session. After logout, that session's `refreshToken` can no longer mint new access tokens.

### 6. Forgot Password
```
POST /auth/forgot-password
```

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (always the same, whether or not the email exists):**
```json
{ "message": "If an account exists for that email, a reset link has been sent." }
```

Sends an email with a link to `FRONTEND_URL/auth/reset-password?token=<token>`. The token is single-use,
expires in 1 hour, and only a SHA-256 hash of it is stored in the database.

### 7. Reset Password
```
POST /auth/reset-password
```

**Request:**
```json
{ "token": "<token-from-email>", "password": "newSecurePassword123" }
```

**Response:**
```json
{ "message": "Your password has been reset. You can now log in." }
```

Fails with `400` if the token is invalid or expired. On success, all of the user's existing sessions are
revoked.

> **Rate limiting:** `/auth/login`, `/auth/register` and `/auth/reset-password` allow 20 requests per IP
> per 15 minutes; `/auth/forgot-password` allows 5 per IP per hour.

---

## KYC Endpoints

### 1. Submit KYC
```
POST /kyc/submit
Authorization: Bearer <onboardingToken or accessToken>
```

**Request:**
```json
{
  "userId": "user-uuid",
  "documentType": "ID_CARD",
  "documentCountry": "US",
  "documentFrontImage": "data:image/jpeg;base64,...",
  "documentBackImage": "data:image/jpeg;base64,...",
  "selfieImages": ["data:image/jpeg;base64,...", "..."],
  "livenessResult": { "anglesCaptured": 5, "method": "guided-rotation" },
  "amlInfo": {
    "dateOfBirth": "1990-05-15",
    "nationality": "HN",
    "countryOfResidence": "HN",
    "occupation": "Engineer",
    "sourceOfFunds": "salary",
    "isPEP": false
  }
}
```

`documentBackImage` is required for `ID_CARD` and `DRIVERS_LICENSE`, not for `PASSPORT`. At least 3 `selfieImages` are required. `amlInfo` is required; `pepDetails` is required when `isPEP` is `true`. `nationality`/`countryOfResidence` are ISO 3166-1 alpha-2 codes.

**Response — quality check failed, retry available** (`400`):
```json
{
  "error": "Some of your photos did not pass our quality check. Please retry.",
  "details": ["Selfie 2: image too dark"],
  "attemptNumber": 1,
  "attemptsRemaining": 2
}
```

**Response — accepted, decision pending** (quality passed, or 3rd attempt / PEP forced into manual review):
```json
{
  "message": "We are verifying your identity. This usually takes a few minutes.",
  "verificationId": "verification-uuid",
  "status": "processing"
}
```

The submission is never resolved instantly. It's held as `status: 'processing'` for about a minute
(`VerificationDecisionService`, `DECISION_DELAY_MS`) so the wait feels real, then resolves to either:
- **`approved`** — GID assigned, `User.status` set to `verified`, approval email sent.
- **`pending`** — a `ManualReviewCase` is created (shows up in `/admin/reviews`); can take up to 24
  hours; the user gets an email once an admin approves or rejects it.

Poll `GET /kyc/status/:userId` to see when it resolves. See `VERIFICATION_ENGINE.md` for exactly what
the automatic quality gate does and does not check.

### 2. Check KYC Status
```
GET /kyc/status/:userId
Authorization: Bearer <onboardingToken or accessToken>
```

**Response:**
```json
{
  "verificationId": "verification-uuid",
  "status": "approved",
  "reviewMode": "automatic",
  "verifiedAt": "2026-07-22T03:00:00Z",
  "rejectionReason": null,
  "gid": "GID-85m856-HND"
}
```

`status` can also be `"processing"` — the decision hasn't been applied yet (still inside the ~1 minute
wait). Keep polling this endpoint until it changes to `approved`, `pending`, or `rejected`.

### 3. Upload GENESIS ID Card Photo
```
POST /kyc/id-card-photo
Authorization: Bearer <accessToken>
```

**Request:**
```json
{ "userId": "user-uuid", "photo": "data:image/jpeg;base64,..." }
```

Requires the user to already be `verified` with a `gid` assigned — this is the dedicated photo shown on
the visual GENESIS ID card, separate from the KYC selfies. Fails with `403` otherwise.

**Response:**
```json
{ "message": "GENESIS ID card photo updated" }
```

---

## Public Endpoints

No authentication — this is what a GENESIS ID card's QR code links to (via the `/verify-gid/:gid` page).
Rate-limited to 30 requests/minute per IP.

### Look Up a GENESIS ID
```
GET /public/gid/:gid
```

**Response:**
```json
{
  "gid": "GID-85m856-HND",
  "fullName": "John Doe",
  "nationality": "HN",
  "idCardPhoto": "data:image/jpeg;base64,...",
  "status": "verified"
}
```

Deliberately minimal — no date of birth, issue/expiry dates, or contact info. Returns `404` if the GID
doesn't exist or the user isn't currently verified.

---

## App Integration Endpoints

All of these require `X-API-Key: <key>` (issued in the admin panel — see `packages/kyc-sdk/README.md` for full integration instructions).

### 1. Check User Status
```
POST /apps/user-status
X-API-Key: gid_live_xxxxxxxxxxxxxxxxxxxx
```

**Request:** (send either `userId` or `gid`)
```json
{ "userId": "user-uuid", "appName": "veta-wallet" }
```
```json
{ "gid": "GID-85m856-HND", "appName": "veta-wallet" }
```

**Response:**
```json
{
  "exists": true,
  "verified": true,
  "userStatus": "verified",
  "isLinked": true,
  "userId": "user-uuid",
  "gid": "GID-85m856-HND",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

### 2. Register App for User
```
POST /apps/register-app
X-API-Key: gid_live_xxxxxxxxxxxxxxxxxxxx
```

**Request:**
```json
{ "userId": "user-uuid", "appName": "veta-wallet" }
```

### 3. Validate a User's Token
```
POST /apps/token-validate
X-API-Key: gid_live_xxxxxxxxxxxxxxxxxxxx
Authorization: Bearer <the-users-jwt>
```

**Response:**
```json
{ "valid": true, "userId": "user-uuid", "email": "user@example.com" }
```

---

## Admin Endpoints

All require a logged-in admin's JWT (`Authorization: Bearer <admin_token>`) — enforced by both `authMiddleware` and `adminMiddleware` (checks `role === 'admin'`).

### Users
```
GET    /admin/users?page=1&limit=20&status=verified&search=john
GET    /admin/users/:userId
DELETE /admin/users/:userId          (soft delete)
```

### Verifications
```
GET /admin/verifications?page=1&limit=20&status=approved
GET /admin/verifications/:verificationId   (full detail incl. submitted images)
```

### Manual Review Queue
```
GET  /admin/manual-reviews?status=pending
POST /admin/reviews/:caseId/approve   { "notes": "..." }
POST /admin/reviews/:caseId/reject    { "notes": "..." }
```

### Connected Apps (API keys)
```
GET    /admin/apps                    (list, with linked-user counts)
POST   /admin/apps                    { "appName": "veta-wallet", "redirectUrls": [...] }
DELETE /admin/apps/:appId             (revoke)
GET    /admin/apps/:appName/users
```

`POST /admin/apps` returns the full API key exactly once — it's shown masked afterward.

### Reports & Logs
```
GET /admin/reports
GET /admin/logs?page=1&limit=50&action=APPROVE_VERIFICATION
```

**Reports response:**
```json
{
  "today": { "newUsers": 42, "verifications": 38, "appLinked": 35 },
  "overall": {
    "totalUsers": 5000,
    "verifiedUsers": 4800,
    "pendingUsers": 200,
    "verificationRate": "96.00%"
  },
  "trend": [...]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [{ "param": "email", "msg": "Invalid email" }]
}
```

### 401 Unauthorized
```json
{ "error": "Invalid or expired token" }
```
or, for app endpoints:
```json
{ "error": "Missing X-API-Key header" }
```

### 403 Forbidden
```json
{ "error": "Admin access required" }
```

### 404 Not Found
```json
{ "error": "User not found" }
```

### 500 Internal Server Error
```json
{ "error": "Internal Server Error", "status": 500, "timestamp": "2024-07-21T10:30:00Z" }
```

---

## Token Expiration
- **Onboarding token**: 2 hours
- **Access token**: 24 hours
- **Refresh token**: 7 days

## Rate Limiting
Implemented on the auth endpoints via `express-rate-limit` (keyed by IP):
- `/auth/login`, `/auth/register`, `/auth/reset-password`: 20 requests per 15 minutes
- `/auth/forgot-password`: 5 requests per hour

In production behind a load balancer, the app sets `trust proxy` so limits key on the real client IP.
