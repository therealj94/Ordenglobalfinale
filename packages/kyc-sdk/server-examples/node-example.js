/**
 * Example: how Veta Wallet's (or any ecosystem app's) BACKEND confirms a
 * user's verification status with GENESIS ID before granting access.
 *
 * This MUST happen server-to-server, never from the browser — it uses your
 * app's secret API key (issued in the GENESIS ID admin panel under
 * Settings > Connected Apps).
 *
 * Run: node node-example.js  (requires axios: npm install axios)
 */
const axios = require('axios');

const GENESIS_ID_URL = process.env.GENESIS_ID_URL || 'http://localhost:3000/api';
const GENESIS_API_KEY = process.env.GENESIS_API_KEY; // gid_live_xxxxxxxx
const APP_NAME = 'veta-wallet';

const genesisClient = axios.create({
  baseURL: GENESIS_ID_URL,
  headers: { 'X-API-Key': GENESIS_API_KEY }
});

/**
 * Call this after the user completes the GenesisKYC widget on the frontend,
 * using the userId your app already knows (the GENESIS ID user id).
 */
async function checkUserVerified(userId) {
  const { data } = await genesisClient.post('/apps/user-status', {
    userId,
    appName: APP_NAME
  });

  // data = { exists, verified, userStatus, isLinked, email, fullName }
  return data;
}

/**
 * Link the user's GENESIS ID account to this app (call once, after their
 * first successful verification, so GENESIS ID tracks the ecosystem link).
 */
async function linkUserToApp(userId) {
  const { data } = await genesisClient.post('/register-app', {
    userId,
    appName: APP_NAME
  });
  return data;
}

/**
 * Validate a GENESIS ID JWT the frontend sends you (e.g. in an Authorization
 * header), to confirm it's a real, non-revoked session before trusting it.
 */
async function validateUserToken(userJwt) {
  const { data } = await genesisClient.post(
    '/apps/token-validate',
    {},
    { headers: { Authorization: `Bearer ${userJwt}` } }
  );
  return data; // { valid, userId, email }
}

// --- Express route example ---
// const express = require('express');
// const router = express.Router();
//
// router.get('/verification-status/:userId', async (req, res) => {
//   try {
//     const status = await checkUserVerified(req.params.userId);
//     res.json(status);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to check verification status' });
//   }
// });

module.exports = { checkUserVerified, linkUserToApp, validateUserToken };
