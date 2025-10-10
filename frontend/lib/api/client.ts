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

  // Portfolio & Dashboard
  async getPortfolio() {
    // Get user's account ID from token
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }
    
    // Decode JWT to get account ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const accountId = payload.account_id;
    
    const response = await this.client.get(`/accounts/${accountId}/balances`);
    return response.data;
  }

  async getRecentTrades(symbol?: string, limit: number = 50) {
    const response = await this.client.get('/trades/recent', {
      params: { symbol, limit },
    });
    return response.data;
  }

  // Market Data
  async getAllTickers() {
    const response = await this.client.get('/ticker/all');
    return response.data;
  }

  async getCandles(symbol: string, interval: string, limit: number = 100) {
    const response = await this.client.get(`/candles/${symbol}`, {
      params: { interval, limit },
    });
    return response.data;
  }

  // User Management
  async updateProfile(data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) {
    const response = await this.client.put('/profile', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.client.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  }

  async enable2FA() {
    const response = await this.client.post('/auth/2fa/enable');
    return response.data;
  }

  async disable2FA(code: string) {
    const response = await this.client.post('/auth/2fa/disable', { code });
    return response.data;
  }

  // KYC
  async submitKYC(data: {
    document_type: string;
    document_number: string;
    document_front: File;
    document_back?: File;
    selfie: File;
  }) {
    const formData = new FormData();
    formData.append('document_type', data.document_type);
    formData.append('document_number', data.document_number);
    formData.append('document_front', data.document_front);
    if (data.document_back) {
      formData.append('document_back', data.document_back);
    }
    formData.append('selfie', data.selfie);

    const response = await this.client.post('/kyc/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getKYCStatus() {
    const response = await this.client.get('/kyc/status');
    return response.data;
  }

  // Deposits & Withdrawals Details
  async getDepositAddress(currency: string) {
    const response = await this.client.get(`/deposits/${currency}/address`);
    return response.data;
  }

  async getDepositHistory(currency?: string, limit: number = 50) {
    const response = await this.client.get('/deposits/history', {
      params: { currency, limit },
    });
    return response.data;
  }

  async getWithdrawalHistory(currency?: string, limit: number = 50) {
    const response = await this.client.get('/withdrawals/history', {
      params: { currency, limit },
    });
    return response.data;
  }

  // Fees
  async getFees() {
    const response = await this.client.get('/fees');
    return response.data;
  }

  async getTradingFees(symbol: string) {
    const response = await this.client.get(`/fees/${symbol}`);
    return response.data;
  }

  // API Keys Management
  async createAPIKey(name: string, permissions: string[]) {
    const response = await this.client.post('/api-keys', { name, permissions });
    return response.data;
  }

  async listAPIKeys() {
    const response = await this.client.get('/api-keys');
    return response.data;
  }

  async revokeAPIKey(keyId: string) {
    const response = await this.client.delete(`/api-keys/${keyId}`);
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



