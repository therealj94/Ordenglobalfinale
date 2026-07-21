# GENESIS ID - API Documentation

## Overview
GENESIS ID es el motor centralizado de verificación facial para el ecosistema Orden Global. Permite que usuarios se registren una sola vez y accedan a todas las apps del ecosistema.

## Base URL
```
https://genesis-id.orden-global.com/api
```

## Authentication
Utiliza JWT (JSON Web Tokens). Incluye el token en el header:
```
Authorization: Bearer <access_token>
```

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
  "email": "user@example.com"
}
```

### 2. Initialize Verification (Facial)
```
POST /auth/verify-init
```

**Request:**
```json
{
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "message": "Verification session created",
  "veriffUrl": "https://station.veriff.com/...",
  "sessionId": "veriff-session-id"
}
```

### 3. Verify Callback (Webhook from Veriff)
```
POST /auth/verify-callback
```

**Request (from Veriff):**
```json
{
  "verification": {
    "id": "session-id",
    "status": "submitted",
    "decision": "approved",
    "timestamp": 1234567890,
    "person": {...},
    "document": {...}
  }
}
```

**Response:**
```json
{
  "message": "Verification approved",
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "status": "verified"
  }
}
```

### 4. Check Verification Status
```
GET /auth/verify-status/:sessionId
```

**Response:**
```json
{
  "status": "approved",
  "verifiedAt": "2024-07-21T10:30:00Z",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "status": "verified"
  }
}
```

### 5. Login
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
    "status": "verified"
  }
}
```

### 6. Refresh Token
```
POST /auth/refresh
```

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "new-jwt-token"
}
```

### 7. Logout
```
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## App Integration Endpoints

### 1. Check User Status (Apps use this)
```
POST /apps/user-status
```

**Request:**
```json
{
  "userId": "user-uuid",
  "appName": "veta-wallet"
}
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
```

**Request:**
```json
{
  "userId": "user-uuid",
  "appName": "veta-wallet"
}
```

**Response:**
```json
{
  "message": "App registered successfully",
  "appRegistration": {
    "id": "registration-uuid",
    "userId": "user-uuid",
    "appName": "veta-wallet",
    "linkedAt": "2024-07-21T10:30:00Z"
  }
}
```

### 3. Validate Token (Apps use this)
```
POST /apps/token-validate
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "valid": true,
  "userId": "user-uuid",
  "email": "user@example.com"
}
```

### 4. Get App Users
```
GET /apps/users/:appName?page=1
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "appName": "veta-wallet",
  "users": [...],
  "count": 50
}
```

---

## Admin Endpoints

Todos requieren autenticación.

### 1. Get Users
```
GET /admin/users?page=1&limit=20&status=verified&search=john
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "total": 150,
  "page": 1,
  "limit": 20,
  "users": [...]
}
```

### 2. Get User Details
```
GET /admin/users/:userId
Authorization: Bearer <admin_token>
```

### 3. Get Verifications
```
GET /admin/verifications?page=1&limit=20&status=approved
Authorization: Bearer <admin_token>
```

### 4. Get Reports
```
GET /admin/reports
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "today": {
    "newUsers": 42,
    "verifications": 38,
    "appLinked": 35
  },
  "overall": {
    "totalUsers": 5000,
    "verifiedUsers": 4800,
    "pendingUsers": 200,
    "verificationRate": "96.00%"
  },
  "trend": [...]
}
```

### 5. Delete User (Soft Delete)
```
DELETE /admin/users/:userId
Authorization: Bearer <admin_token>
```

### 6. Get Admin Logs
```
GET /admin/logs?page=1&limit=50&action=DELETE_USER
Authorization: Bearer <admin_token>
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "param": "email",
      "msg": "Invalid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "status": 500,
  "timestamp": "2024-07-21T10:30:00Z"
}
```

---

## Token Expiration
- **Access Token**: 24 horas
- **Refresh Token**: 7 días

---

## Rate Limiting
Por implementar en próximas fases.

## Webhooks
- Veriff webhook para notificar decisiones de verificación
