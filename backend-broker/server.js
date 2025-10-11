// BitCurrent Backend - Simplified Broker Model
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const balancesRoutes = require('./routes/balances');
const depositsRoutes = require('./routes/deposits');
const withdrawalsRoutes = require('./routes/withdrawals');
const adminRoutes = require('./routes/admin');

// Import services
const { pool } = require('./config/database');
const alpaca = require('./services/alpaca'); // Using Alpaca for crypto trading

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
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

