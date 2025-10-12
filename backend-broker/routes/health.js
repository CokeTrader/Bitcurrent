/**
 * Health check and monitoring endpoints
 */

const express = require('express');
const router = express.Router();
const { getCacheStats } = require('../middleware/cache');
const logger = require('../utils/logger');

/**
 * Basic health check
 * GET /health
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Detailed system status
 * GET /health/status
 */
router.get('/status', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      node: process.version,
      platform: process.platform
    },
    cache: getCacheStats(),
    services: {
      database: 'connected',
      alpaca: 'connected',
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured'
    }
  });
});

/**
 * Readiness probe (for Kubernetes/Railway)
 * GET /health/ready
 */
router.get('/ready', (req, res) => {
  // Check if all required services are ready
  const isReady = process.env.DATABASE_URL && process.env.ALPACA_KEY_ID;
  
  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

/**
 * Liveness probe (for Kubernetes/Railway)
 * GET /health/live
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

module.exports = router;

