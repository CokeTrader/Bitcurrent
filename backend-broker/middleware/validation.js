// Input validation and sanitization middleware
const validator = require('validator');
const xss = require('xss');

/**
 * Sanitize string input - remove XSS threats
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return xss(str.trim());
}

/**
 * Validate and sanitize email
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  if (trimmed.length > 255) {
    return { valid: false, error: 'Email too long' };
  }
  
  return { valid: true, value: trimmed };
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password too long' };
  }
  
  // Check for at least one uppercase, one lowercase, one number
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  return { valid: true, value: password };
}

/**
 * Validate cryptocurrency symbol
 */
function validateSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return { valid: false, error: 'Symbol is required' };
  }
  
  const trimmed = symbol.trim().toUpperCase();
  
  // Must be 2-10 characters, alphanumeric only
  if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid symbol format' };
  }
  
  return { valid: true, value: trimmed };
}

/**
 * Validate numeric amount (price, quantity, etc.)
 */
function validateAmount(amount, fieldName = 'Amount') {
  if (amount === undefined || amount === null) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  const num = parseFloat(amount);
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  
  if (num <= 0) {
    return { valid: false, error: `${fieldName} must be positive` };
  }
  
  if (!isFinite(num)) {
    return { valid: false, error: `${fieldName} must be finite` };
  }
  
  // Check for reasonable precision (max 8 decimal places)
  const str = num.toString();
  const decimal = str.split('.')[1];
  if (decimal && decimal.length > 8) {
    return { valid: false, error: `${fieldName} has too many decimal places (max 8)` };
  }
  
  return { valid: true, value: num };
}

/**
 * Validate order side (buy/sell)
 */
function validateOrderSide(side) {
  if (!side || typeof side !== 'string') {
    return { valid: false, error: 'Order side is required' };
  }
  
  const normalized = side.toLowerCase().trim();
  
  if (!['buy', 'sell'].includes(normalized)) {
    return { valid: false, error: 'Order side must be "buy" or "sell"' };
  }
  
  return { valid: true, value: normalized };
}

/**
 * Validate order type
 */
function validateOrderType(type) {
  if (!type || typeof type !== 'string') {
    return { valid: false, error: 'Order type is required' };
  }
  
  const normalized = type.toLowerCase().trim();
  
  if (!['market', 'limit', 'stop', 'stop_limit'].includes(normalized)) {
    return { valid: false, error: 'Invalid order type' };
  }
  
  return { valid: true, value: normalized };
}

/**
 * Validate UUID
 */
function validateUUID(uuid, fieldName = 'ID') {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  if (!validator.isUUID(uuid)) {
    return { valid: false, error: `Invalid ${fieldName} format` };
  }
  
  return { valid: true, value: uuid };
}

/**
 * Validate currency code (GBP, USD, EUR, etc.)
 */
function validateCurrency(currency) {
  if (!currency || typeof currency !== 'string') {
    return { valid: false, error: 'Currency is required' };
  }
  
  const trimmed = currency.trim().toUpperCase();
  
  // Must be exactly 3 letters
  if (!/^[A-Z]{3}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid currency code format' };
  }
  
  // Whitelist of supported currencies
  const supported = ['GBP', 'USD', 'EUR', 'BTC', 'ETH'];
  if (!supported.includes(trimmed)) {
    return { valid: false, error: `Currency ${trimmed} not supported` };
  }
  
  return { valid: true, value: trimmed };
}

/**
 * Middleware: Validate order creation request
 */
function validateOrderRequest(req, res, next) {
  const errors = [];
  
  // Validate symbol
  const symbolResult = validateSymbol(req.body.symbol);
  if (!symbolResult.valid) {
    errors.push(symbolResult.error);
  } else {
    req.body.symbol = symbolResult.value;
  }
  
  // Validate side
  const sideResult = validateOrderSide(req.body.side);
  if (!sideResult.valid) {
    errors.push(sideResult.error);
  } else {
    req.body.side = sideResult.value;
  }
  
  // Validate type
  const typeResult = validateOrderType(req.body.type);
  if (!typeResult.valid) {
    errors.push(typeResult.error);
  } else {
    req.body.type = typeResult.value;
  }
  
  // Validate quantity
  const qtyResult = validateAmount(req.body.quantity, 'Quantity');
  if (!qtyResult.valid) {
    errors.push(qtyResult.error);
  } else {
    req.body.quantity = qtyResult.value;
  }
  
  // Validate price (for limit orders)
  if (req.body.type === 'limit' || req.body.type === 'stop_limit') {
    const priceResult = validateAmount(req.body.price, 'Price');
    if (!priceResult.valid) {
      errors.push(priceResult.error);
    } else {
      req.body.price = priceResult.value;
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
}

/**
 * Middleware: Validate registration request
 */
function validateRegistration(req, res, next) {
  const errors = [];
  
  // Validate email
  const emailResult = validateEmail(req.body.email);
  if (!emailResult.valid) {
    errors.push(emailResult.error);
  } else {
    req.body.email = emailResult.value;
  }
  
  // Validate password
  const passwordResult = validatePassword(req.body.password);
  if (!passwordResult.valid) {
    errors.push(passwordResult.error);
  }
  
  // Sanitize optional fields
  if (req.body.firstName) {
    req.body.firstName = sanitizeString(req.body.firstName);
    if (req.body.firstName.length > 50) {
      errors.push('First name too long');
    }
  }
  
  if (req.body.lastName) {
    req.body.lastName = sanitizeString(req.body.lastName);
    if (req.body.lastName.length > 50) {
      errors.push('Last name too long');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
}

/**
 * Middleware: Validate login request
 */
function validateLogin(req, res, next) {
  const errors = [];
  
  // Validate email
  const emailResult = validateEmail(req.body.email);
  if (!emailResult.valid) {
    errors.push(emailResult.error);
  } else {
    req.body.email = emailResult.value;
  }
  
  // Check password exists (don't validate strength for login)
  if (!req.body.password || typeof req.body.password !== 'string') {
    errors.push('Password is required');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
}

/**
 * General request body sanitizer
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  next();
}

module.exports = {
  // Validators
  validateEmail,
  validatePassword,
  validateSymbol,
  validateAmount,
  validateOrderSide,
  validateOrderType,
  validateUUID,
  validateCurrency,
  sanitizeString,
  
  // Middleware
  validateOrderRequest,
  validateRegistration,
  validateLogin,
  sanitizeBody
};


