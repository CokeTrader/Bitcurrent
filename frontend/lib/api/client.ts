// BitCurrent API Client
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed && error.config) {
            return this.client.request(error.config);
          }
          // Refresh failed, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken,
      });

      if (response.data.token) {
        this.setToken(response.data.token);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.token) {
      this.setToken(response.data.token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
    }
    return response.data;
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const response = await this.client.post('/auth/register', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/profile');
    return response.data;
  }

  // Orders
  async placeOrder(order: {
    symbol: string;
    side: 'buy' | 'sell';
    order_type: 'market' | 'limit';
    price?: string;
    quantity: string;
    time_in_force?: string;
    post_only?: boolean;
  }) {
    const response = await this.client.post('/orders', order);
    return response.data;
  }

  async listOrders(symbol?: string, status?: string) {
    const response = await this.client.get('/orders', {
      params: { symbol, status },
    });
    return response.data;
  }

  async getOrder(id: string) {
    const response = await this.client.get(`/orders/${id}`);
    return response.data;
  }

  async cancelOrder(id: string) {
    const response = await this.client.delete(`/orders/${id}`);
    return response.data;
  }

  // Account
  async getBalances(accountId: string) {
    const response = await this.client.get(`/accounts/${accountId}/balances`);
    return response.data;
  }

  async getTransactions(accountId: string, currency?: string) {
    const response = await this.client.get(`/accounts/${accountId}/transactions`, {
      params: { currency },
    });
    return response.data;
  }

  // Markets
  async getMarkets() {
    const response = await this.client.get('/markets');
    return response.data;
  }

  async getOrderbook(symbol: string, depth: number = 20) {
    const response = await this.client.get(`/orderbook/${symbol}`, {
      params: { depth },
    });
    return response.data;
  }

  async getTicker(symbol: string) {
    const response = await this.client.get(`/ticker/${symbol}`);
    return response.data;
  }

  // Deposits & Withdrawals
  async initiateDeposit(currency: string, amount: string) {
    const response = await this.client.post('/deposits', { currency, amount });
    return response.data;
  }

  async requestWithdrawal(currency: string, amount: string, address?: string) {
    const response = await this.client.post('/withdrawals', {
      currency,
      amount,
      address,
    });
    return response.data;
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
    }
  }
}

export const apiClient = new APIClient();



