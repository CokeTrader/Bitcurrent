/**
 * Advanced Authentication Middleware
 * Enhanced security for financial operations
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const QueryBuilder = require('../database/query-builder');

// Track failed login attempts
const failedAttempts = new Map();
const blockedIPs = new Set();

/**
 * Rate limit failed login attempts
 */
function checkFailedAttempts(identifier) {
  const attempts = failedAttempts.get(identifier) || { count: 0, firstAttempt: Date.now() };
  
  // Reset counter after 15 minutes
  if (Date.now() - attempts.firstAttempt > 15 * 60 * 1000) {
    failedAttempts.delete(identifier);
    return { blocked: false, remaining: 5 };
  }
  
  // Block after 5 attempts in 15 minutes
  if (attempts.count >= 5) {
    blockedIPs.add(identifier);
    return { blocked: true, remaining: 0 };
  }
  
  return { blocked: false, remaining: 5 - attempts.count };
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(identifier) {
  const attempts = failedAttempts.get(identifier) || { count: 0, firstAttempt: Date.now() };
  attempts.count++;
  failedAttempts.set(identifier, attempts);
  
  logger.warn('Failed login attempt', { identifier, count: attempts.count });
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(identifier) {
  failedAttempts.delete(identifier);
  blockedIPs.delete(identifier);
}

/**
 * Enhanced JWT verification
 */
async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token age (max 24 hours)
    const tokenAge = Date.now() - (decoded.iat * 1000);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return { valid: false, error: 'Token expired (max 24h)' };
    }
    
    // Verify token hasn't been revoked
    // TODO: Check against revoked tokens table
    
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Middleware: Enhanced authentication
 */
async function enhancedAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
  }
  
  // Verify token
  const verification = await verifyToken(token);
  
  if (!verification.valid) {
    logger.warn('Invalid token', { error: verification.error, ip: req.ip });
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
  
  // Attach user to request
  req.user = verification.payload;
  req.userId = verification.payload.userId;
  
  next();
}

/**
 * Middleware: Require email verification
 */
async function requireVerifiedEmail(req, res, next) {
  // Check if user's email is verified
  // In a real system, query database
  if (!req.user.emailVerified) {
    return res.status(403).json({
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  
  next();
}

/**
 * Middleware: Require KYC verification
 */
async function requireKYC(req, res, next) {
  // Check KYC status
  if (!req.user.kycVerified) {
    return res.status(403).json({
      error: 'KYC verification required for this operation',
      code: 'KYC_REQUIRED',
      message: 'Please complete KYC verification to access this feature'
    });
  }
  
  next();
}

/**
 * Middleware: Require 2FA for sensitive operations
 */
async function require2FA(req, res, next) {
  const twoFactorToken = req.headers['x-2fa-token'];
  
  // If user has 2FA enabled, require valid token
  if (req.user.twoFactorEnabled) {
    if (!twoFactorToken) {
      return res.status(403).json({
        error: '2FA token required',
        code: '2FA_REQUIRED'
      });
    }
    
    // Verify 2FA token
    // TODO: Implement TOTP verification
    const isValid = true; // Placeholder
    
    if (!isValid) {
      return res.status(403).json({
        error: 'Invalid 2FA token',
        code: '2FA_INVALID'
      });
    }
  }
  
  next();
}

/**
 * Middleware: Session timeout check
 */
function checkSessionTimeout(req, res, next) {
  const lastActivity = req.user.lastActivity;
  const timeoutMinutes = 30;
  
  if (lastActivity && Date.now() - lastActivity > timeoutMinutes * 60 * 1000) {
    return res.status(401).json({
      error: 'Session expired due to inactivity',
      code: 'SESSION_TIMEOUT'
    });
  }
  
  next();
}

/**
 * Middleware: IP whitelist check (optional for admin routes)
 */
function checkIPWhitelist(whitelist = []) {
  return (req, res, next) => {
    if (whitelist.length === 0) return next();
    
    const clientIP = req.ip;
    
    if (!whitelist.includes(clientIP)) {
      logger.warn('IP not whitelisted', { ip: clientIP, path: req.path });
      return res.status(403).json({
        error: 'Access denied from this IP',
        code: 'IP_NOT_WHITELISTED'
      });
    }
    
    next();
  };
}

/**
 * Middleware: Check if account is locked
 */
async function checkAccountLocked(req, res, next) {
  if (req.user.accountLocked) {
    return res.status(403).json({
      error: 'Account is locked. Contact support.',
      code: 'ACCOUNT_LOCKED'
    });
  }
  
  next();
}

/**
 * Combined security middleware for financial operations
 */
const financialOperationAuth = [
  enhancedAuth,
  checkAccountLocked,
  requireVerifiedEmail,
  requireKYC,
  require2FA,
  checkSessionTimeout
];

module.exports = {
  enhancedAuth,
  requireVerifiedEmail,
  requireKYC,
  require2FA,
  checkSessionTimeout,
  checkIPWhitelist,
  checkAccountLocked,
  financialOperationAuth,
  checkFailedAttempts,
  recordFailedAttempt,
  clearFailedAttempts
};

