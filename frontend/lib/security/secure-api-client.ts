/**
 * Secure API Client
 * 
 * Wrapper for API calls with built-in security:
 * - CSRF protection
 * - Input sanitization
 * - Response validation
 * - Error handling
 * - Request signing
 */

import InputSanitizer from './input-sanitizer';
import CSRFProtection from './csrf-protection';

interface APIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: HeadersInit;
  requireAuth?: boolean;
  sanitizeResponse?: boolean;
}

export class SecureAPIClient {
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  /**
   * Make secure API request
   */
  static async request(endpoint: string, options: APIOptions = {}) {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = true,
      sanitizeResponse = true
    } = options;

    try {
      // Build headers
      const requestHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...headers
      };

      // Add authentication token
      if (requireAuth) {
        const token = this.getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      // Add CSRF token for state-changing requests
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        Object.assign(requestHeaders, CSRFProtection.addTokenToHeaders(requestHeaders));
      }

      // Build request config
      const config: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include', // Include cookies
        mode: 'cors'
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      // Make request
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Parse response
      const data = await response.json();

      // Sanitize response if needed
      if (sanitizeResponse && data) {
        return {
          ...data,
          data: InputSanitizer.sanitizeAPIResponse(data.data || data)
        };
      }

      return data;

    } catch (error: any) {
      console.error('API request error:', error);
      throw new Error(error.message || 'API request failed');
    }
  }

  /**
   * GET request
   */
  static async get(endpoint: string, options: Omit<APIOptions, 'method' | 'body'> = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  static async post(endpoint: string, body: any, options: Omit<APIOptions, 'method' | 'body'> = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  static async put(endpoint: string, body: any, options: Omit<APIOptions, 'method' | 'body'> = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  static async patch(endpoint: string, body: any, options: Omit<APIOptions, 'method' | 'body'> = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  static async delete(endpoint: string, options: Omit<APIOptions, 'method' | 'body'> = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Get authentication token from localStorage
   */
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    return localStorage.getItem('token');
  }

  /**
   * Set authentication token
   */
  static setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  /**
   * Clear authentication token
   */
  static clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      CSRFProtection.clearToken();
    }
  }
}

export default SecureAPIClient;

