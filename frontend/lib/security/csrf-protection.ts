/**
 * CSRF Protection for Frontend
 * 
 * Prevent Cross-Site Request Forgery attacks
 */

export class CSRFProtection {
  private static tokenKey = 'bitcurrent_csrf_token';

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Store in sessionStorage (cleared on tab close)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.tokenKey, token);
    }
    
    return token;
  }

  /**
   * Get current CSRF token
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    let token = sessionStorage.getItem(this.tokenKey);
    
    if (!token) {
      token = this.generateToken();
    }
    
    return token;
  }

  /**
   * Add CSRF token to request headers
   */
  static addTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = this.getToken();
    
    if (!token) {
      return headers;
    }
    
    return {
      ...headers,
      'X-CSRF-Token': token
    };
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.tokenKey);
    }
  }
}

export default CSRFProtection;

