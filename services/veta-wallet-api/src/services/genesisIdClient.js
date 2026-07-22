const axios = require('axios');

// Veta Wallet never stores a password of its own — every login is a
// server-to-server call to GENESIS ID, the shared identity provider for
// the whole Orden Global ecosystem. This client wraps those calls.
const GENESIS_API_URL = process.env.GENESIS_API_URL || 'http://localhost:3000/api';
const GENESIS_API_KEY = process.env.GENESIS_API_KEY;

if (!GENESIS_API_KEY) {
  console.warn('[genesisIdClient] GENESIS_API_KEY is not set — app-to-app calls to GENESIS ID will fail.');
}

const client = axios.create({
  baseURL: GENESIS_API_URL,
  timeout: 10000
});

/**
 * Logs a user in directly against GENESIS ID using their email/password.
 * Returns { accessToken, refreshToken, user } on success, or throws with
 * the upstream error message on failure (invalid credentials, not
 * verified, etc.) so the caller can forward a useful message.
 */
async function loginWithGenesisId(email, password) {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
}

/**
 * Confirms a GENESIS ID access token is still valid and not revoked.
 * Server-to-server only (requires our X-API-Key).
 */
async function validateToken(accessToken) {
  const response = await client.post(
    '/apps/token-validate',
    {},
    {
      headers: {
        'X-API-Key': GENESIS_API_KEY,
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  return response.data;
}

/**
 * Looks up a user's authoritative verification status + GID by userId.
 * Never trust the frontend's own claim of "verified" — always confirm here.
 */
async function getUserStatus(userId) {
  const response = await client.post(
    '/apps/user-status',
    { userId, appName: 'veta-wallet' },
    { headers: { 'X-API-Key': GENESIS_API_KEY } }
  );
  return response.data;
}

/**
 * Links this user's GENESIS ID account to Veta Wallet (idempotent).
 */
async function registerApp(userId) {
  const response = await client.post(
    '/apps/register-app',
    { userId, appName: 'veta-wallet' },
    { headers: { 'X-API-Key': GENESIS_API_KEY } }
  );
  return response.data;
}

module.exports = { loginWithGenesisId, validateToken, getUserStatus, registerApp };
