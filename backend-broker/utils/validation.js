/**
 * Input validation utilities
 * Reusable validation functions for API inputs
 */

const logger = require('./logger');

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  
  return { valid: true };
}

/**
 * Validate cryptocurrency symbol
 */
function isValidSymbol(symbol) {
  const validSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX'];
  const validPairs = validSymbols.map(s => `${s}-GBP`);
  
  return validPairs.includes(symbol) || validSymbols.includes(symbol);
}

/**
 * Validate order side
 */
function isValidSide(side) {
  return ['buy', 'sell'].includes(side);
}

/**
 * Validate order type
 */
function isValidOrderType(type) {
  return ['market', 'limit'].includes(type);
}

/**
 * Validate amount (positive number)
 */
function isValidAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Validate GBP amount (min £10)
 */
function isValidGBPAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 10 && isFinite(num);
}

/**
 * Validate cryptocurrency quantity
 */
function isValidQuantity(quantity, symbol) {
  const num = parseFloat(quantity);
  if (isNaN(num) || num <= 0 || !isFinite(num)) {
    return { valid: false, error: 'Invalid quantity' };
  }
  
  // Minimum order sizes
  const minimums = {
    'BTC': 0.0001,
    'ETH': 0.001,
    'SOL': 0.1,
    'XRP': 10,
    'ADA': 10,
    'DOGE': 100,
    'DOT': 1,
    'AVAX': 0.1
  };
  
  const min = minimums[symbol] || 0.0001;
  
  if (num < min) {
    return { valid: false, error: `Minimum order is ${min} ${symbol}` };
  }
  
  return { valid: true };
}

/**
 * Validate API key ID format
 */
function isValidAPIKeyId(keyId) {
  return typeof keyId === 'string' && keyId.startsWith('BC') && keyId.length === 34;
}

/**
 * Sanitize string input
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .slice(0, 255); // Limit length
}

/**
 * Validate UK phone number
 */
function isValidUKPhone(phone) {
  const ukPhoneRegex = /^(\+44|0)7\d{9}$/;
  return ukPhoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate referral code
 */
function isValidReferralCode(code) {
  return typeof code === 'string' && code.startsWith('BC') && code.length === 10;
}

/**
 * Express validation middleware factory
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      if (rules.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value && rules.type === 'email' && !isValidEmail(value)) {
        errors.push(`${field} must be a valid email`);
      }
      
      if (value && rules.type === 'password') {
        const result = isValidPassword(value);
        if (!result.valid) {
          errors.push(result.error);
        }
      }
      
      if (value && rules.type === 'amount' && !isValidAmount(value)) {
        errors.push(`${field} must be a positive number`);
      }
      
      if (value && rules.type === 'symbol' && !isValidSymbol(value)) {
        errors.push(`${field} is not a valid trading symbol`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
    }
    
    next();
  };
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidSymbol,
  isValidSide,
  isValidOrderType,
  isValidAmount,
  isValidGBPAmount,
  isValidQuantity,
  isValidAPIKeyId,
  isValidUKPhone,
  isValidReferralCode,
  sanitizeString,
  validateRequest
};


