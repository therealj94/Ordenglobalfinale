import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_WALLET_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' }
    });

    this.client.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vetaWalletToken') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('vetaWalletToken');
          localStorage.removeItem('vetaWalletUser');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
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
}

export const apiClient = new ApiClient();
