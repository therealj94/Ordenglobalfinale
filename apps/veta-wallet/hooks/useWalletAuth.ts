import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { WalletUser } from '@/types';

export const useWalletAuth = () => {
  const [user, setUser] = useState<WalletUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('vetaWalletUser') : null;
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore corrupt cache
      }
    }
    setInitializing(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, walletUser } = response.data;
      localStorage.setItem('vetaWalletToken', token);
      localStorage.setItem('vetaWalletUser', JSON.stringify(walletUser));
      setUser(walletUser);
      return walletUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vetaWalletToken');
    localStorage.removeItem('vetaWalletUser');
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const response = await apiClient.get('/wallet/me');
    localStorage.setItem('vetaWalletUser', JSON.stringify(response.data));
    setUser(response.data);
    return response.data;
  }, []);

  return { user, setUser, loading, initializing, login, logout, refreshProfile };
};
