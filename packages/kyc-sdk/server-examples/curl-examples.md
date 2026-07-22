# GENESIS ID — Server-to-Server API Examples (any language)

These are plain HTTP calls, so they work from **any backend stack** (PHP, Python,
Ruby, Java, Go, .NET, etc.) — not just Node.js. Just send them with your
language's HTTP client and the `X-API-Key` header from your app's GENESIS ID
connection (Admin panel → Settings → Connected Apps).

Base URL (local dev): `http://localhost:3000/api`
Base URL (production): `https://genesis-id.orden-global.com/api`

---

## 1. Check if a user is verified

```bash
curl -X POST https://genesis-id.orden-global.com/api/apps/user-status \
  -H "X-API-Key: gid_live_xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_UUID_FROM_YOUR_APP",
    "appName": "veta-wallet"
  }'
```

Response:
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

## 2. Link a verified user to your app

```bash
curl -X POST https://genesis-id.orden-global.com/api/apps/register-app \
  -H "X-API-Key: gid_live_xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_UUID_FROM_YOUR_APP",
    "appName": "veta-wallet"
  }'
```

## 3. Validate a user's GENESIS ID session token

If your app receives a GENESIS ID JWT from the frontend (e.g. after login),
confirm it's real and not revoked:

```bash
curl -X POST https://genesis-id.orden-global.com/api/apps/token-validate \
  -H "X-API-Key: gid_live_xxxxxxxxxxxxxxxxxxxx" \
  -H "Authorization: Bearer <the-users-jwt>"
```

Response:
```json
{ "valid": true, "userId": "...", "email": "..." }
```

---

## PHP example

```php
<?php
$ch = curl_init('https://genesis-id.orden-global.com/api/apps/user-status');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: gid_live_xxxxxxxxxxxxxxxxxxxx',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'userId' => $userId,
    'appName' => 'veta-wallet'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = json_decode(curl_exec($ch), true);
curl_close($ch);
```

## Python example

```python
import requests

response = requests.post(
    'https://genesis-id.orden-global.com/api/apps/user-status',
    headers={'X-API-Key': 'gid_live_xxxxxxxxxxxxxxxxxxxx'},
    json={'userId': user_id, 'appName': 'veta-wallet'}
)
data = response.json()
```

---

## Security notes

- **Never** put the `X-API-Key` in frontend/browser code — it must only be used
  server-to-server.
- If a key leaks, revoke it immediately in the GENESIS ID admin panel
  (Settings → Connected Apps → Revoke) and issue a new one.
- All calls should happen over HTTPS in production.
