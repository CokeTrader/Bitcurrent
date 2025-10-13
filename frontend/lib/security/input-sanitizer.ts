/**
 * Frontend Input Sanitization
 * 
 * Prevent XSS, injection attacks, and malicious input
 */

import DOMPurify from 'isomorphic-dompurify';

export class InputSanitizer {
  
  /**
   * Sanitize HTML to prevent XSS
   */
  static sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false
    });
  }

  /**
   * Sanitize plain text (strip all HTML)
   */
  static sanitizeText(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string | null {
    const sanitized = this.sanitizeText(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(sanitized)) {
      return null;
    }
    
    return sanitized;
  }

  /**
   * Validate and sanitize numeric input
   */
  static sanitizeNumber(input: string | number, options: {
    min?: number;
    max?: number;
    decimals?: number;
  } = {}): number | null {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }

    if (options.min !== undefined && num < options.min) {
      return null;
    }

    if (options.max !== undefined && num > options.max) {
      return null;
    }

    if (options.decimals !== undefined) {
      return parseFloat(num.toFixed(options.decimals));
    }

    return num;
  }

  /**
   * Validate Bitcoin address
   */
  static validateBitcoinAddress(address: string): boolean {
    const sanitized = this.sanitizeText(address).trim();
    
    // P2PKH (legacy) addresses
    const p2pkhRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    
    // Bech32 (SegWit) addresses  
    const bech32Regex = /^(bc1|tb1)[a-z0-9]{39,59}$/;
    
    return p2pkhRegex.test(sanitized) || bech32Regex.test(sanitized);
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url: string): string | null {
    const sanitized = this.sanitizeText(url).trim();
    
    try {
      const urlObj = new URL(sanitized);
      
      // Only allow https
      if (urlObj.protocol !== 'https:') {
        return null;
      }
      
      return urlObj.toString();
    } catch {
      return null;
    }
  }

  /**
   * Sanitize username
   */
  static sanitizeUsername(username: string): string | null {
    const sanitized = this.sanitizeText(username).trim();
    
    // Only alphanumeric, underscore, hyphen
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    
    if (!usernameRegex.test(sanitized)) {
      return null;
    }
    
    return sanitized;
  }

  /**
   * Sanitize trading amount
   */
  static sanitizeTradingAmount(amount: string | number, currency: 'GBP' | 'BTC' | 'ETH' | 'SOL'): number | null {
    const minimums = {
      GBP: 1,
      BTC: 0.00000001,
      ETH: 0.000001,
      SOL: 0.001
    };

    const maximums = {
      GBP: 1000000,
      BTC: 100,
      ETH: 10000,
      SOL: 1000000
    };

    const decimals = {
      GBP: 2,
      BTC: 8,
      ETH: 8,
      SOL: 6
    };

    return this.sanitizeNumber(amount, {
      min: minimums[currency],
      max: maximums[currency],
      decimals: decimals[currency]
    });
  }

  /**
   * Escape special characters for safe display
   */
  static escapeHTML(str: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Validate API response to prevent XSS from backend
   */
  static sanitizeAPIResponse(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeText(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeAPIResponse(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeAPIResponse(value);
      }
      return sanitized;
    }
    
    return data;
  }
}

export default InputSanitizer;

