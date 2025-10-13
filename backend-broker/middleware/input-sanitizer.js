/**
 * Input Sanitization Middleware
 * Prevents XSS and injection attacks
 */

const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');
const logger = require('../utils/logger');

/**
 * Sanitize string input (remove HTML/scripts)
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and scripts
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Trim whitespace
  return cleaned.trim();
}

/**
 * Sanitize email
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  
  const normalized = validator.normalizeEmail(email);
  return validator.isEmail(normalized) ? normalized : null;
}

/**
 * Sanitize numeric input
 */
function sanitizeNumber(input, options = {}) {
  const num = parseFloat(input);
  
  if (isNaN(num)) return null;
  if (options.min !== undefined && num < options.min) return null;
  if (options.max !== undefined && num > options.max) return null;
  if (options.decimals !== undefined) {
    return parseFloat(num.toFixed(options.decimals));
  }
  
  return num;
}

/**
 * Sanitize trading pair
 */
function sanitizeTradingPair(pair) {
  if (!pair || typeof pair !== 'string') return null;
  
  // Only allow uppercase letters and forward slash
  const cleaned = pair.toUpperCase().replace(/[^A-Z/]/g, '');
  
  // Validate format (e.g., BTC/USD)
  if (!/^[A-Z]{2,10}\/[A-Z]{2,10}$/.test(cleaned)) return null;
  
  return cleaned;
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Middleware to sanitize request body
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    try {
      req.body = sanitizeObject(req.body);
      req.sanitized = true;
    } catch (error) {
      logger.error('Body sanitization failed', { error: error.message });
      return res.status(400).json({
        error: 'Invalid request body',
        code: 'INVALID_INPUT'
      });
    }
  }
  next();
}

/**
 * Middleware to sanitize query parameters
 */
function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    try {
      req.query = sanitizeObject(req.query);
    } catch (error) {
      logger.error('Query sanitization failed', { error: error.message });
      return res.status(400).json({
        error: 'Invalid query parameters',
        code: 'INVALID_QUERY'
      });
    }
  }
  next();
}

/**
 * Validate trading request
 */
function validateTradeRequest(req, res, next) {
  const { pair, side, amount, price, type } = req.body;
  
  // Validate pair
  const sanitizedPair = sanitizeTradingPair(pair);
  if (!sanitizedPair) {
    return res.status(400).json({
      error: 'Invalid trading pair format',
      code: 'INVALID_PAIR'
    });
  }
  
  // Validate side
  if (!['buy', 'sell'].includes(side?.toLowerCase())) {
    return res.status(400).json({
      error: 'Invalid trade side (must be buy or sell)',
      code: 'INVALID_SIDE'
    });
  }
  
  // Validate amount
  const sanitizedAmount = sanitizeNumber(amount, { min: 0.00000001, decimals: 8 });
  if (!sanitizedAmount) {
    return res.status(400).json({
      error: 'Invalid amount (must be positive number)',
      code: 'INVALID_AMOUNT'
    });
  }
  
  // Validate type
  if (!['market', 'limit'].includes(type?.toLowerCase())) {
    return res.status(400).json({
      error: 'Invalid order type (must be market or limit)',
      code: 'INVALID_TYPE'
    });
  }
  
  // Validate price for limit orders
  if (type.toLowerCase() === 'limit') {
    const sanitizedPrice = sanitizeNumber(price, { min: 0.01 });
    if (!sanitizedPrice) {
      return res.status(400).json({
        error: 'Invalid price for limit order',
        code: 'INVALID_PRICE'
      });
    }
    req.body.price = sanitizedPrice;
  }
  
  // Update with sanitized values
  req.body.pair = sanitizedPair;
  req.body.side = side.toLowerCase();
  req.body.amount = sanitizedAmount;
  req.body.type = type.toLowerCase();
  
  next();
}

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeTradingPair,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  validateTradeRequest
};

