/**
 * Trading Bots API Routes
 */

const express = require('express');
const router = express.Router();
const tradingBotService = require('../services/trading-bot-service');
const { authenticateToken } = require('../middleware/api-auth');

router.use(authenticateToken);

/**
 * POST /api/v1/bots/dca
 * Create a DCA (Dollar Cost Averaging) bot
 */
router.post('/dca', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await tradingBotService.createDCABot(userId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Create DCA bot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create DCA bot'
    });
  }
});

/**
 * POST /api/v1/bots/grid
 * Create a Grid Trading bot
 */
router.post('/grid', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await tradingBotService.createGridBot(userId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Create grid bot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create grid bot'
    });
  }
});

/**
 * POST /api/v1/bots/rsi
 * Create an RSI-based bot
 */
router.post('/rsi', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await tradingBotService.createRSIBot(userId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Create RSI bot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create RSI bot'
    });
  }
});

/**
 * GET /api/v1/bots
 * Get user's bots
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const result = await tradingBotService.getUserBots(userId, status);
    res.json(result);
  } catch (error) {
    console.error('Get bots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve bots'
    });
  }
});

/**
 * PATCH /api/v1/bots/:botId/status
 * Update bot status (active/paused)
 */
router.patch('/:botId/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const botId = parseInt(req.params.botId);
    const { status } = req.body;

    if (!status || !['active', 'paused', 'stopped'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const result = await tradingBotService.updateBotStatus(userId, botId, status);
    res.json(result);
  } catch (error) {
    console.error('Update bot status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bot status'
    });
  }
});

/**
 * DELETE /api/v1/bots/:botId
 * Delete a bot
 */
router.delete('/:botId', async (req, res) => {
  try {
    const userId = req.user.id;
    const botId = parseInt(req.params.botId);
    const result = await tradingBotService.deleteBot(userId, botId);
    res.json(result);
  } catch (error) {
    console.error('Delete bot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete bot'
    });
  }
});

/**
 * GET /api/v1/bots/:botId/stats
 * Get bot performance statistics
 */
router.get('/:botId/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const botId = parseInt(req.params.botId);
    const result = await tradingBotService.getBotStats(userId, botId);
    res.json(result);
  } catch (error) {
    console.error('Get bot stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve bot statistics'
    });
  }
});

module.exports = router;

