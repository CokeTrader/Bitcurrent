/**
 * Advanced Analytics API Routes
 */

const express = require('express');
const router = express.Router();
const portfolioAnalyticsService = require('../services/portfolio-analytics-service');
const { authenticateToken } = require('../middleware/api-auth');

router.use(authenticateToken);

/**
 * GET /api/v1/analytics/portfolio
 * Get comprehensive portfolio analytics
 * Query params: timeframe (24h, 7d, 30d, 90d, 1y, all)
 */
router.get('/portfolio', async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe } = req.query;
    
    const result = await portfolioAnalyticsService.getPortfolioAnalytics(
      userId,
      timeframe || '30d'
    );
    
    res.json(result);
  } catch (error) {
    console.error('Get portfolio analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics'
    });
  }
});

/**
 * GET /api/v1/analytics/performance
 * Get performance metrics
 */
router.get('/performance', async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe } = req.query;
    
    const result = await portfolioAnalyticsService.getPerformanceMetrics(
      userId,
      timeframe || '30d'
    );
    
    res.json({
      success: true,
      performance: result
    });
  } catch (error) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance metrics'
    });
  }
});

/**
 * GET /api/v1/analytics/allocation
 * Get asset allocation breakdown
 */
router.get('/allocation', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await portfolioAnalyticsService.getAssetAllocation(userId);
    
    res.json({
      success: true,
      allocation: result
    });
  } catch (error) {
    console.error('Get asset allocation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve asset allocation'
    });
  }
});

/**
 * GET /api/v1/analytics/top-performers
 * Get top performing assets
 */
router.get('/top-performers', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await portfolioAnalyticsService.getTopPerformers(userId);
    
    res.json({
      success: true,
      topPerformers: result
    });
  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve top performers'
    });
  }
});

/**
 * GET /api/v1/analytics/trade-stats
 * Get trade statistics
 */
router.get('/trade-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await portfolioAnalyticsService.getTradeStatistics(userId);
    
    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Get trade stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trade statistics'
    });
  }
});

/**
 * GET /api/v1/analytics/risk
 * Get risk metrics
 */
router.get('/risk', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await portfolioAnalyticsService.getRiskMetrics(userId);
    
    res.json({
      success: true,
      risk: result
    });
  } catch (error) {
    console.error('Get risk metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve risk metrics'
    });
  }
});

/**
 * GET /api/v1/analytics/historical
 * Get historical portfolio value
 */
router.get('/historical', async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe } = req.query;
    
    const result = await portfolioAnalyticsService.getHistoricalValue(
      userId,
      timeframe || '30d'
    );
    
    res.json({
      success: true,
      historical: result
    });
  } catch (error) {
    console.error('Get historical value error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve historical data'
    });
  }
});

/**
 * GET /api/v1/analytics/comparison
 * Compare multiple assets
 * Query params: assets (comma-separated, e.g., BTC,ETH,SOL)
 */
router.get('/comparison', async (req, res) => {
  try {
    const userId = req.user.id;
    const assets = req.query.assets ? req.query.assets.split(',') : ['BTC', 'ETH', 'SOL'];
    
    const result = await portfolioAnalyticsService.getAssetComparison(userId, assets);
    
    res.json(result);
  } catch (error) {
    console.error('Get asset comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve asset comparison'
    });
  }
});

/**
 * GET /api/v1/analytics/report
 * Generate performance report
 * Query params: format (json, csv)
 */
router.get('/report', async (req, res) => {
  try {
    const userId = req.user.id;
    const { format } = req.query;
    
    const result = await portfolioAnalyticsService.generatePerformanceReport(
      userId,
      format || 'json'
    );
    
    if (format === 'csv' && result.success) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.csv);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

module.exports = router;
