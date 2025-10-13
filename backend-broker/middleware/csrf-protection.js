/**
 * CSRF Protection Middleware
 * Prevents Cross-Site Request Forgery attacks
 */

const csrf = require('csurf');
const logger = require('../utils/logger');

// CSRF protection for cookie-based sessions
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

/**
 * Apply CSRF protection to state-changing routes
 */
function applyCsrfProtection(req, res, next) {
  // Skip CSRF for API key authentication (different security model)
  if (req.headers['x-api-key']) {
    return next();
  }

  // Apply CSRF for session-based requests
  csrfProtection(req, res, (err) => {
    if (err) {
      logger.warn('CSRF token validation failed', {
        ip: req.ip,
        path: req.path,
        error: err.message
      });
      return res.status(403).json({
        error: 'Invalid CSRF token',
        code: 'CSRF_INVALID'
      });
    }
    next();
  });
}

/**
 * Middleware to attach CSRF token to response
 */
function attachCsrfToken(req, res, next) {
  // Skip for API key requests
  if (req.headers['x-api-key']) {
    return next();
  }

  // Generate and attach token
  try {
    res.locals.csrfToken = req.csrfToken();
    next();
  } catch (error) {
    logger.error('Failed to generate CSRF token', { error: error.message });
    next();
  }
}

/**
 * Route-specific CSRF protection
 */
const protectedRoutes = [
  '/api/v1/orders',
  '/api/v1/deposits',
  '/api/v1/withdrawals',
  '/api/v1/transfers',
  '/api/v1/settings',
  '/api/v1/security/2fa',
  '/api/v1/kyc'
];

function shouldProtectRoute(path) {
  return protectedRoutes.some(route => path.startsWith(route));
}

/**
 * Smart CSRF middleware - only protects state-changing operations
 */
function smartCsrfProtection(req, res, next) {
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const needsProtection = shouldProtectRoute(req.path);
  
  if (isStateChanging && needsProtection) {
    return applyCsrfProtection(req, res, next);
  }
  
  next();
}

module.exports = {
  csrfProtection: applyCsrfProtection,
  attachCsrfToken,
  smartCsrfProtection
};

