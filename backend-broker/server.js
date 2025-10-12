// BitCurrent Backend - Simplified Broker Model  
// PostgreSQL connection via Railway DATABASE_URL environment variable
// Google OAuth environment variables required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('dotenv').config();

// Temporarily disable Google OAuth to debug backend crash
// TODO: Re-enable once crash is resolved
// const session = require('express-session');
// const passport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const balancesRoutes = require('./routes/balances');
const depositsRoutes = require('./routes/deposits');
const withdrawalsRoutes = require('./routes/withdrawals');
const adminRoutes = require('./routes/admin');
const adminDashboardRoutes = require('./routes/admin-dashboard');
const migrateRoutes = require('./routes/migrate');
const paperTradingRoutes = require('./routes/paper-trading');
// Temporarily disable 2FA and paper-funds to fix crash
// const twoFARoutes = require('./routes/2fa');
// const paperFundsRoutes = require('./routes/paper-funds');

// Import services
const { pool } = require('./config/database');
const alpaca = require('./services/alpaca'); // Using Alpaca for crypto trading

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.alpaca.markets", "https://paper-api.alpaca.markets"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
// CORS configuration - allow multiple frontend URLs
const allowedOrigins = [
  'http://localhost:3000',
  'https://bitcurrent.co.uk',
  'https://www.bitcurrent.co.uk',
  'https://bitcurrent.vercel.app',
  'https://bitcurrent-git-main-coketraders-projects.vercel.app'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));

// DDoS Protection Layer 1: Speed limiter (slows down responses after threshold)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: 500 // Add 500ms delay per request above the threshold
});
app.use('/api/', speedLimiter);

// DDoS Protection Layer 2: Hard rate limit
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Block after 100 requests
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// DDoS Protection Layer 3: Aggressive auth protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  skipSuccessfulRequests: true, // Only count failed attempts
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// DDoS Protection Layer 4: Aggressive order placement protection
const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Max 10 orders per minute
  message: 'Too many orders. Please slow down.',
  skipSuccessfulRequests: false
});
app.use('/api/v1/orders', orderLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Temporarily disabled Google OAuth session middleware
// TODO: Re-enable once OAuth is debugged
// app.use(session({ ... }));
// app.use(passport.initialize());
// app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/balances', balancesRoutes);
app.use('/api/v1/deposits', depositsRoutes);
app.use('/api/v1/withdrawals', withdrawalsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/migrate', migrateRoutes);
app.use('/api/v1/paper-trading', paperTradingRoutes);
// Temporarily disabled to fix crash
// app.use('/api/v1/2fa', twoFARoutes);
// app.use('/api/v1/paper', paperFundsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'BitCurrent API',
    version: '1.0.0',
    mode: 'broker',
    status: 'operational',
    docs: '/api/v1/docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log full error details for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Send safe error response (no stack traces in production)
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'An error occurred. Please try again or contact support if the problem persists.'
    : err.message || 'Internal server error';
  
  res.status(err.status || 500).json({
    success: false,
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    
    // Test Alpaca connection
    const alpacaConnected = await alpaca.testConnection();
    if (!alpacaConnected) {
      console.warn('⚠️  Alpaca API connection failed - check your API keys');
    }
    
    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 BitCurrent Backend Started');
      console.log('================================');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log('================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

