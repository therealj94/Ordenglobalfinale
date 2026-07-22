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
  "livenessResult": { "anglesCaptured": 5, "method": "guided-rotation" }
}
```

`documentBackImage` is required for `ID_CARD` and `DRIVERS_LICENSE`, not for `PASSPORT`. At least 3 `selfieImages` are required.

**Response:**
```json
{
  "message": "KYC submitted successfully, pending review",
  "verificationId": "verification-uuid",
  "status": "pending"
}
```

This creates a `ManualReviewCase` that shows up in the admin panel at `/admin/reviews`.

### 2. Check KYC Status
```
GET /kyc/status/:userId
Authorization: Bearer <onboardingToken or accessToken>
```

**Response:**
```json
{
  "verificationId": "verification-uuid",
  "status": "pending",
  "reviewMode": "manual",
  "verifiedAt": null,
  "rejectionReason": null
}
```

---

## App Integration Endpoints

All of these require `X-API-Key: <key>` (issued in the admin panel — see `packages/kyc-sdk/README.md` for full integration instructions).

### 1. Check User Status
```
POST /apps/user-status
X-API-Key: gid_live_xxxxxxxxxxxxxxxxxxxx
```

**Request:**
```json
{ "userId": "user-uuid", "appName": "veta-wallet" }
```

**Response:**
```json
{
  "exists": true,
  "verified": true,
  "userStatus": "verified",
  "isLinked": true,
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
Not yet implemented — planned for a future phase.
