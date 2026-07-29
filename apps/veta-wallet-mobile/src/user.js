import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import * as api from './api';

// Holds the logged-in GENESIS ID user for the whole app. Screens read the
// real identity (name, GID, passport photo) from here; when no one is logged
// in (pure demo browsing) the derived helpers fall back to the app's original
// mock values so the designed UI is unchanged.
const UserCtx = createContext(null);
export const useUser = () => useContext(UserCtx);

const DEMO = { name: 'José Enamorado', initials: 'JE', email: 'jose@ordenglobal.com' };

function initialsOf(name) {
  if (!name) return DEMO.initials;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || DEMO.initials;
}

export function UserProvider({ children }) {
  const [session, setSession] = useState(null); // { accessToken, refreshToken, user }
  const [profile, setProfile] = useState(null); // full /auth/me user
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (sess) => {
    if (!sess?.accessToken) return;
    try {
      const { user } = await api.me(sess.accessToken);
      setProfile(user);
    } catch (e) {
      // Access token likely expired — try one refresh, then retry once.
      if (e.status === 401 && sess.refreshToken) {
        try {
          const { accessToken } = await api.refresh(sess.refreshToken);
          const next = { ...sess, accessToken };
          setSession(next);
          await api.saveSession(next);
          const { user } = await api.me(accessToken);
          setProfile(user);
        } catch (e2) {
          // Refresh failed — keep the basic login user, leave full profile empty.
        }
      }
    }
  }, []);

  // On launch, restore any saved session and hydrate the full profile.
  useEffect(() => {
    (async () => {
      try {
        const sess = await api.getSession();
        if (sess) {
          setSession(sess);
          await hydrate(sess);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrate]);

  // Called by the login screen right after a successful sign-in.
  const setSessionFromLogin = useCallback(async (data) => {
    setSession(data);
    setProfile(data.user || null);
    await hydrate(data);
  }, [hydrate]);

  const refreshProfile = useCallback(async () => {
    if (session) await hydrate(session);
  }, [session, hydrate]);

  // The identity can change on GENESIS ID while the app sits in the
  // background — most obviously the passport photo and signature, which are
  // added over there. Without this the app would keep showing whatever it
  // fetched at sign-in and never learn the photo exists.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshProfile();
    });
    return () => sub.remove();
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    setSession(null);
    setProfile(null);
    await api.clearSession();
  }, []);

  const user = profile || session?.user || null;
  const value = {
    loading,
    session,
    profile,
    user,
    isLoggedIn: !!session,
    // Display helpers with graceful fallback to the original demo identity.
    displayName: user?.fullName || DEMO.name,
    email: user?.email || DEMO.email,
    initials: initialsOf(user?.fullName),
    photo: profile?.idCardPhoto || null,
    gid: user?.gid || null,
    setSessionFromLogin,
    refreshProfile,
    logout,
  };

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}
