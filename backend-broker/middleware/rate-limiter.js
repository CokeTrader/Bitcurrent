/**
 * Rate limiting middleware
 * Prevents abuse and ensures fair usage
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userId: req.user?.id
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Auth endpoints rate limiter
 * Stricter limits for login/register
 * 5 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      email: req.body?.email
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many attempts. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Trading endpoints rate limiter
 * 30 trades per minute (reasonable for active traders)
 */
const tradingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: 'Trading rate limit exceeded. Maximum 30 orders per minute.'
  },
  handler: (req, res) => {
    logger.warn('Trading rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      symbol: req.body?.symbol
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many orders. Maximum 30 per minute.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Deposit/Withdrawal rate limiter
 * 10 per hour (prevents abuse)
 */
const financialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: 'Too many financial transactions. Maximum 10 per hour.'
  },
  handler: (req, res) => {
    logger.warn('Financial rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      action: req.url
    });
    
    res.status(429).json({
      success: false,
      error: 'Transaction limit exceeded. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  tradingLimiter,
  financialLimiter
};

