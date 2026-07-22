import { useState, useCallback, useEffect } from 'react';
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';
import { apiClient } from '@/lib/apiClient';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);

      return { accessToken, refreshToken, user };
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('refreshToken');
      if (!token) throw new Error('No refresh token');

      const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
        refreshToken: token
      });

      localStorage.setItem('accessToken', response.data.accessToken);
      return response.data.accessToken;
    } catch (err) {
      logout();
      throw err;
    }
  }, [logout]);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      setUser(response.data.user);
      return response.data.user;
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    user,
    setUser,
    loading,
    error,
    register,
    login,
    logout,
    refreshToken,
    fetchProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };
};
