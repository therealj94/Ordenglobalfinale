import AsyncStorage from '@react-native-async-storage/async-storage';

// GENESIS ID's live API. Override with EXPO_PUBLIC_GENESIS_API_URL when
// pointing at a local backend during development (e.g. your machine's LAN
// IP or http://10.0.2.2:3000/api for the Android emulator) — "localhost"
// from the phone/emulator refers to the device itself, not your computer.
export const API_BASE_URL = process.env.EXPO_PUBLIC_GENESIS_API_URL || 'https://api.genesisid.online/api';

const SESSION_KEY = 'veta_genesis_session';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    throw new Error((data && data.error) || 'Algo salió mal. Intenta de nuevo.');
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
