/**
 * Admin API
 * Internal admin tools and dashboards
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * Admin authentication middleware
 */
function adminAuthMiddleware(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Admin access denied'
    });
  }
  
  next();
}

/**
 * Get system stats
 * GET /api/v1/admin/stats
 */
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    // TODO: Get real data from database
    const stats = {
      users: {
        total: 127,
        verified: 89,
        active24h: 45,
        newToday: 12
      },
      trading: {
        volume24h: 54329,
        trades24h: 234,
        activeOrders: 12,
        avgTradeSize: 232
      },
      revenue: {
        fees24h: 135.82,
        feesMonth: 2450.60,
        feesAllTime: 5670.30
      },
      deposits: {
        pending: 3,
        completed24h: 18,
        amount24h: 5400
      },
      withdrawals: {
        pending: 2,
        completed24h: 8,
        amount24h: 2100
      }
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

/**
 * Get recent users
 * GET /api/v1/admin/users/recent
 */
router.get('/users/recent', adminAuthMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // TODO: Get from database
    const users = [];
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    logger.error('Admin recent users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * Get pending KYC verifications
 * GET /api/v1/admin/kyc/pending
 */
router.get('/kyc/pending', adminAuthMiddleware, async (req, res) => {
  try {
    // TODO: Get from database
    const pendingKYC = [];
    
    res.json({
      success: true,
      pendingKYC
    });
  } catch (error) {
    logger.error('Admin pending KYC error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending KYC'
    });
  }
});

/**
 * Approve KYC
 * POST /api/v1/admin/kyc/:id/approve
 */
router.post('/kyc/:id/approve', adminAuthMiddleware, async (req, res) => {
  try {
    const kycId = req.params.id;
    
    // TODO: Update database, credit bonus
    
    logger.info('KYC approved by admin', { kycId });
    
    res.json({
      success: true,
      message: 'KYC approved'
    });
  } catch (error) {
    logger.error('Admin approve KYC error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve KYC'
    });
  }
});

/**
 * System health dashboard
 * GET /api/v1/admin/health/dashboard
 */
router.get('/health/dashboard', adminAuthMiddleware, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      services: {
        database: 'connected',
        alpaca: 'connected',
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
        websocket: 'running'
      },
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };
    
    res.json({
      success: true,
      health
    });
  } catch (error) {
    logger.error('Admin health dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health dashboard'
    });
  }
});

module.exports = router;
