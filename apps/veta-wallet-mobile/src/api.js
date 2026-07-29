import AsyncStorage from '@react-native-async-storage/async-storage';

// GENESIS ID's live API. Override with EXPO_PUBLIC_GENESIS_API_URL when
// pointing at a local backend during development (e.g. your machine's LAN
// IP or http://10.0.2.2:3000/api for the Android emulator) — "localhost"
// from the phone/emulator refers to the device itself, not your computer.
export const API_BASE_URL = process.env.EXPO_PUBLIC_GENESIS_API_URL || 'https://api.genesisid.online/api';

// GENESIS ID's hosted web app — used only to launch its embedded KYC flow
// (facial + document capture, AML form, quality checks), which the app
// receives as a service rather than reimplementing natively.
// Note: use the www host — the apex genesisid.online currently returns a TLS
// "unrecognized_name" alert (ERR_SSL_UNRECOGNIZED_NAME_ALERT) on device
// because its certificate isn't provisioned on Vercel; www serves a valid one.
export const GENESIS_APP_URL = process.env.EXPO_PUBLIC_GENESIS_APP_URL || 'https://www.genesisid.online';

const SESSION_KEY = 'veta_genesis_session';
const APP_NAME = 'veta-wallet';

// A hosted backend that has scaled to zero takes the better part of a minute
// to answer its first request. fetch() has no timeout of its own, so without
// this the app just sits on a spinner with no way out and no explanation.
const FIRST_TRY_MS = 20000;
const WAKE_UP_MS = 45000;

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const init = {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  };

  let res;
  try {
    res = await fetchWithTimeout(url, init, FIRST_TRY_MS);
  } catch (first) {
    // Retry once with a longer window: the first request is what wakes a
    // sleeping backend, so the second usually lands quickly.
    try {
      res = await fetchWithTimeout(url, init, WAKE_UP_MS);
    } catch (second) {
      const err = new Error(
        second.name === 'AbortError'
          ? 'El servicio no respondió a tiempo. Revisa tu conexión e intenta de nuevo.'
          : 'No pudimos conectar con GENESIS ID. Revisa tu conexión e intenta de nuevo.'
      );
      err.isNetwork = true;
      throw err;
    }
  }

  let data = null;
  try { data = await res.json(); } catch (e) {}

  if (!res.ok) {
    const err = new Error(
      (data && data.error) ||
        (res.status >= 500
          ? 'GENESIS ID tuvo un problema interno. Intenta de nuevo en un momento.'
          : 'Algo salió mal. Intenta de nuevo.')
    );
    err.status = res.status;
    throw err;
  }
  return data;
}

export function register({ email, password, fullName, phone }) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, fullName, phone }) });
}

export function login({ email, password }) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function forgotPassword({ email }) {
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export function kycVerifyUrl({ userId, onboardingToken, returnUrl }) {
  const params = new URLSearchParams({ userId, appName: APP_NAME, onboardingToken, returnUrl });
  return `${GENESIS_APP_URL}/embed/verify?${params.toString()}`;
}

// Full profile of the logged-in user — includes the GENESIS ID fields the
// login response omits (gid, idCardPhoto, signature, nationality,
// dateOfBirth, gidIssuedAt, gidExpiresAt), all sourced from the engine.
export function me(accessToken) {
  return request('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });
}

export function refresh(refreshToken) {
  return request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
}

// Real KYC state straight from the engine. The app checks this itself instead
// of trusting the deep link alone — browsers drop app-scheme redirects that
// weren't triggered by a tap, so the callback can simply never arrive even
// though verification succeeded.
export function kycStatus({ userId, token }) {
  return request(`/kyc/status/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
}

// Turns the registration's onboarding token into a real session, but only
// once GENESIS ID has actually verified the user.
export function exchangeOnboarding(onboardingToken) {
  return request('/auth/exchange-onboarding', { method: 'POST', body: JSON.stringify({ onboardingToken }) });
}

// For someone who already has a GENESIS ID account but never finished
// verification: re-opens the KYC flow for that existing identity instead of
// making them create a second account they don't need.
export function verificationSession({ email, password }) {
  return request('/auth/verification-session', { method: 'POST', body: JSON.stringify({ email, password }) });
}

// Hands GENESIS ID the wallet address this app knows the user by, so the GID
// can be resolved to their Veta Wallet account across the ecosystem.
export function linkAddress({ accessToken, address }) {
  return request('/apps/my-address', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ appName: APP_NAME, address }),
  });
}

// Public verification page for a GID — what the passport card's QR encodes,
// so anyone can scan it to confirm the identity against GENESIS ID.
export function verifyGidUrl(gid) {
  return `${GENESIS_APP_URL}/verify-gid/${encodeURIComponent(gid)}`;
}

export async function saveSession({ accessToken, refreshToken, user }) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ accessToken, refreshToken, user }));
}

export async function getSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
