/**
 * Social Trading API Routes
 */

const express = require('express');
const router = express.Router();
const socialTradingService = require('../services/social-trading-service');
const { authenticateToken } = require('../middleware/api-auth');

router.use(authenticateToken);

/**
 * GET /api/v1/social/leaderboard
 * Get top traders leaderboard
 * Query: period (24h, 7d, 30d, 90d, all), limit
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { period, limit } = req.query;
    const result = await socialTradingService.getLeaderboard(
      period || '30d',
      parseInt(limit) || 100
    );
    res.json(result);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve leaderboard'
    });
  }
});

/**
 * GET /api/v1/social/trader/:traderId
 * Get trader profile
 */
router.get('/trader/:traderId', async (req, res) => {
  try {
    const { traderId } = req.params;
    const result = await socialTradingService.getTraderProfile(parseInt(traderId));
    res.json(result);
  } catch (error) {
    console.error('Get trader profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trader profile'
    });
  }
});

/**
 * POST /api/v1/social/follow/:traderId
 * Follow a trader
 */
router.post('/follow/:traderId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { traderId } = req.params;
    const result = await socialTradingService.followTrader(
      userId,
      parseInt(traderId)
    );
    res.json(result);
  } catch (error) {
    console.error('Follow trader error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow trader'
    });
  }
});

/**
 * DELETE /api/v1/social/follow/:traderId
 * Unfollow a trader
 */
router.delete('/follow/:traderId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { traderId } = req.params;
    const result = await socialTradingService.unfollowTrader(
      userId,
      parseInt(traderId)
    );
    res.json(result);
  } catch (error) {
    console.error('Unfollow trader error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow trader'
    });
  }
});

/**
 * POST /api/v1/social/copy-trading/:traderId/enable
 * Enable copy trading for a trader
 * Body: { copyPercentage, maxAmountPerTrade, stopLoss }
 */
router.post('/copy-trading/:traderId/enable', async (req, res) => {
  try {
    const userId = req.user.id;
    const { traderId } = req.params;
    const result = await socialTradingService.enableCopyTrading(
      userId,
      parseInt(traderId),
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Enable copy trading error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable copy trading'
    });
  }
});

/**
 * POST /api/v1/social/copy-trading/:traderId/disable
 * Disable copy trading
 */
router.post('/copy-trading/:traderId/disable', async (req, res) => {
  try {
    const userId = req.user.id;
    const { traderId } = req.params;
    const result = await socialTradingService.disableCopyTrading(
      userId,
      parseInt(traderId)
    );
    res.json(result);
  } catch (error) {
    console.error('Disable copy trading error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable copy trading'
    });
  }
});

/**
 * GET /api/v1/social/following
 * Get user's following list
 */
router.get('/following', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await socialTradingService.getFollowing(userId);
    res.json(result);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve following list'
    });
  }
});

module.exports = router;

