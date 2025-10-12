/**
 * Security middleware
 * Helmet, CORS, XSS protection
 */

const helmet = require('helmet');
const cors = require('cors');

/**
 * Security headers configuration
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://bitcurrent.vercel.app',
      'https://bitcurrent.co.uk',
      'https://www.bitcurrent.co.uk',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
};

/**
 * XSS sanitization
 */
function sanitizeInput(req, res, next) {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '') // Remove < and >
          .trim();
      }
    });
  }
  
  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/[<>]/g, '')
          .trim();
      }
    });
  }
  
  next();
}

/**
 * Request validation
 */
function validateRequest(req, res, next) {
  // Block suspicious user agents
  const userAgent = req.headers['user-agent'] || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && !req.url.startsWith('/api/v1/markets')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  next();
}

module.exports = {
  securityHeaders,
  corsOptions: cors(corsOptions),
  sanitizeInput,
  validateRequest
};

