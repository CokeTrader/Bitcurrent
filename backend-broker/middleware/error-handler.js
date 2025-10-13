/**
 * Global error handler middleware
 * Catches all errors and returns consistent JSON responses
 */

const logger = require('../utils/logger');

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log error with context
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Determine error type and response
  let statusCode = 500;
  let message = 'Internal server error';

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Authentication errors
  if (err.name === 'UnauthorizedError' || err.message.includes('token')) {
    statusCode = 401;
    message = 'Authentication required';
  }

  // Not found errors
  if (err.message.includes('not found')) {
    statusCode = 404;
    message = err.message;
  }

  // Alpaca API errors
  if (err.message.includes('Alpaca')) {
    statusCode = 503;
    message = 'Trading service temporarily unavailable';
  }

  // Stripe API errors
  if (err.type && err.type.startsWith('Stripe')) {
    statusCode = 503;
    message = 'Payment service temporarily unavailable';
  }

  // Rate limit errors
  if (err.message.includes('rate limit')) {
    statusCode = 429;
    message = 'Too many requests. Please try again later.';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message
    })
  });
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res) {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`);
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch promise rejections
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};


