/**
 * Admin Dashboard API Routes
 */

const express = require('express');
const router = express.Router();
const { enhancedAuth } = require('../middleware/advanced-auth');
const AnalyticsService = require('../services/analytics-service');
const logger = require('../utils/logger');
const performanceMonitor = require('../utils/performance-monitor');

/**
 * Middleware to check admin role
 */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
}

/**
 * GET /api/v1/admin/dashboard
 * Get admin dashboard overview
 */
router.get('/dashboard',
  enhancedAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const stats = await AnalyticsService.getPlatformStats();
      const performance = performanceMonitor.getMetrics();

      res.json({
        success: true,
        dashboard: {
          users: {
            total: stats.total_users,
            verified: stats.verified_users,
            verificationRate: ((stats.verified_users / stats.total_users) * 100).toFixed(2) + '%'
          },
          trading: {
            totalTrades: stats.total_trades,
            totalVolume: stats.total_volume,
            avgTradeSize: (stats.total_volume / stats.total_trades).toFixed(2)
          },
          financial: {
            totalDeposits: stats.total_deposits,
            totalWithdrawals: stats.total_withdrawals,
            netFlow: stats.total_deposits - stats.total_withdrawals
          },
          system: {
            totalRequests: performance.totalRequests,
            errorRate: performance.errorRate,
            avgResponseTime: performance.avgResponseTime + 'ms',
            slowRequests: performance.slowRequests
          }
        },
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Failed to get admin dashboard', { error: error.message });
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/users
 * List all users with filters
 */
router.get('/users',
  enhancedAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { status, kyc, limit = 50, offset = 0 } = req.query;

      // Mock user list (in production, query from database)
      const users = [
        {
          id: 1,
          email: 'user1@example.com',
          status: 'active',
          kycVerified: true,
          balance: 10000,
          totalTrades: 45,
          createdAt: '2025-10-01'
        },
        {
          id: 2,
          email: 'user2@example.com',
          status: 'active',
          kycVerified: false,
          balance: 500,
          totalTrades: 3,
          createdAt: '2025-10-10'
        }
      ];

      res.json({
        success: true,
        users,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: users.length
        }
      });
    } catch (error) {
      logger.error('Failed to get users list', { error: error.message });
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/pending-withdrawals
 * Get pending withdrawal requests
 */
router.get('/pending-withdrawals',
  enhancedAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      // Mock pending withdrawals
      const withdrawals = [
        {
          id: 1,
          userId: 123,
          amount: 1000,
          currency: 'GBP',
          destination: 'GB29NWBK60161331926819',
          status: 'pending',
          requestedAt: Date.now() - 3600000
        }
      ];

      res.json({
        success: true,
        withdrawals,
        count: withdrawals.length
      });
    } catch (error) {
      logger.error('Failed to get pending withdrawals', { error: error.message });
      next(error);
    }
  }
);

/**
 * POST /api/v1/admin/withdrawals/:id/approve
 * Approve withdrawal
 */
router.post('/withdrawals/:id/approve',
  enhancedAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      logger.info('Withdrawal approved by admin', {
        withdrawalId: id,
        adminId: req.userId
      });

      res.json({
        success: true,
        message: 'Withdrawal approved'
      });
    } catch (error) {
      logger.error('Failed to approve withdrawal', { error: error.message });
      next(error);
    }
  }
);

/**
 * POST /api/v1/admin/withdrawals/:id/reject
 * Reject withdrawal
 */
router.post('/withdrawals/:id/reject',
  enhancedAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: 'Rejection reason required',
          code: 'REASON_REQUIRED'
        });
      }

      logger.info('Withdrawal rejected by admin', {
        withdrawalId: id,
        adminId: req.userId,
        reason
      });

      res.json({
        success: true,
        message: 'Withdrawal rejected'
      });
    } catch (error) {
      logger.error('Failed to reject withdrawal', { error: error.message });
      next(error);
    }
  }
);

/**
 * GET /api/v1/admin/logs
 * Get system logs
 */
router.get('/logs',
  enhancedAuth,
  requireAdmin,
  (req, res) => {
    const { level = 'info', limit = 100 } = req.query;

    // In production, fetch from Winston logs or logging service
    const logs = [
      {
        level: 'info',
        message: 'User registered',
        timestamp: Date.now(),
        metadata: { userId: 123 }
      },
      {
        level: 'warn',
        message: 'Slow API response',
        timestamp: Date.now() - 60000,
        metadata: { path: '/api/orders', duration: '1234ms' }
      }
    ];

    res.json({
      success: true,
      logs,
      filters: { level, limit }
    });
  }
);

module.exports = router;
