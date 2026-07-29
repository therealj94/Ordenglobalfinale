import axios, { AxiosInstance, AxiosError } from 'axios';
import { isOnboardingToken } from './token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      // A hosted backend that has scaled to zero takes the better part of a
      // minute to answer its first request. Without a ceiling the browser just
      // spins with nothing to tell the user; 60s is long enough to cover that
      // cold start and short enough to fail with a message instead of hanging.
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Mid-onboarding, a 401 is the expected answer from anything outside
          // the KYC endpoints — that token isn't meant to open them. Bouncing
          // to the login screen here would throw the user out halfway through
          // verifying and leave the account stranded as unverified.
          if (isOnboardingToken()) {
            return Promise.reject(error);
          }

          // Nothing was ever stored, so there's no session to have expired.
          // Redirecting here sent pages that legitimately load without a
          // credential — /verify reached from a link, say — into a loop:
          // request 401s, this navigates to login, the page loads and asks
          // again. Let the page decide what to show instead.
          if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
            return Promise.reject(error);
          }

          // Already on an auth screen: navigating to it again would reload the
          // page out from under whatever the user is typing.
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')) {
            return Promise.reject(error);
          }

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              // Clear auth and redirect to login
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/auth/login';
              return Promise.reject(error);
            }

            const response = await axios.post<{ accessToken: string }>(
              `${API_URL}/auth/refresh`,
              { refreshToken }
            );

            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  get<T = any>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }

  patch<T = any>(url: string, data?: any, config?: any) {
    return this.client.patch<T>(url, data, config);
  }
}

export const apiClient = new ApiClient();
