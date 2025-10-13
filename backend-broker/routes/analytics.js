/**
 * Analytics API Routes
 */

const express = require('express');
const router = express.Router();
const { enhancedAuth } = require('../middleware/advanced-auth');
const AnalyticsService = require('../services/analytics-service');
const logger = require('../utils/logger');

/**
 * GET /api/v1/analytics/portfolio
 * Get portfolio performance
 */
router.get('/portfolio',
  enhancedAuth,
  async (req, res, next) => {
    try {
      const { days = 30 } = req.query;
      
      const performance = await AnalyticsService.getPortfolioPerformance(
        req.userId,
        parseInt(days)
      );

      res.json({
        success: true,
        performance,
        period: `${days} days`
      });
    } catch (error) {
      logger.error('Failed to get portfolio performance', {
        userId: req.userId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/stats
 * Get trading statistics
 */
router.get('/stats',
  enhancedAuth,
  async (req, res, next) => {
    try {
      const stats = await AnalyticsService.getTradingStats(req.userId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Failed to get trading stats', {
        userId: req.userId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/pnl
 * Get profit/loss calculation
 */
router.get('/pnl',
  enhancedAuth,
  async (req, res, next) => {
    try {
      const pnl = await AnalyticsService.calculateProfitLoss(req.userId);

      res.json({
        success: true,
        pnl
      });
    } catch (error) {
      logger.error('Failed to calculate P&L', {
        userId: req.userId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/top-pairs
 * Get top trading pairs
 */
router.get('/top-pairs',
  enhancedAuth,
  async (req, res, next) => {
    try {
      const { limit = 5 } = req.query;
      
      const pairs = await AnalyticsService.getTopPairs(
        req.userId,
        parseInt(limit)
      );

      res.json({
        success: true,
        pairs
      });
    } catch (error) {
      logger.error('Failed to get top pairs', {
        userId: req.userId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/heatmap
 * Get trading activity heatmap
 */
router.get('/heatmap',
  enhancedAuth,
  async (req, res, next) => {
    try {
      const { days = 90 } = req.query;
      
      const heatmap = await AnalyticsService.getTradingHeatmap(
        req.userId,
        parseInt(days)
      );

      res.json({
        success: true,
        heatmap
      });
    } catch (error) {
      logger.error('Failed to get trading heatmap', {
        userId: req.userId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/analytics/track
 * Track custom event
 */
router.post('/track',
  enhancedAuth,
  async (req, res, next) => {
    try {
      const { eventType, metadata } = req.body;

      if (!eventType) {
        return res.status(400).json({
          error: 'Event type required',
          code: 'EVENT_TYPE_REQUIRED'
        });
      }

      await AnalyticsService.trackEvent(req.userId, eventType, metadata);

      res.json({
        success: true,
        message: 'Event tracked'
      });
    } catch (error) {
      logger.error('Failed to track event', {
        userId: req.userId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/analytics/platform
 * Get platform-wide statistics (admin only)
 */
router.get('/platform',
  enhancedAuth,
  async (req, res, next) => {
    try {
      // Check admin role
      if (!req.user.isAdmin) {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      const stats = await AnalyticsService.getPlatformStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Failed to get platform stats', {
        error: error.message
      });
      next(error);
    }
  }
);

module.exports = router;

