/**
 * Price Alerts & Watchlists API Routes
 */

const express = require('express');
const router = express.Router();
const priceAlertService = require('../services/price-alert-service');
const { authenticateToken } = require('../middleware/api-auth');

router.use(authenticateToken);

/**
 * POST /api/v1/alerts/create
 * Create price alert
 */
router.post('/create', async (req, res) => {
  try {
    const userId = req.user.id;
    const { asset, targetPrice, condition } = req.body;

    if (!asset || !targetPrice || !condition) {
      return res.status(400).json({
        success: false,
        error: 'asset, targetPrice, and condition required'
      });
    }

    const result = await priceAlertService.createPriceAlert(
      userId,
      asset,
      targetPrice,
      condition
    );

    res.json(result);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert'
    });
  }
});

/**
 * GET /api/v1/alerts
 * Get user's alerts
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const result = await priceAlertService.getUserAlerts(userId, status);
    res.json(result);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts'
    });
  }
});

/**
 * DELETE /api/v1/alerts/:alertId
 * Delete alert
 */
router.delete('/:alertId', async (req, res) => {
  try {
    const userId = req.user.id;
    const alertId = parseInt(req.params.alertId);
    const result = await priceAlertService.deleteAlert(userId, alertId);
    res.json(result);
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert'
    });
  }
});

/**
 * POST /api/v1/alerts/watchlists
 * Create watchlist
 */
router.post('/watchlists', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, assets } = req.body;

    if (!name || !assets || !Array.isArray(assets)) {
      return res.status(400).json({
        success: false,
        error: 'name and assets array required'
      });
    }

    const result = await priceAlertService.createWatchlist(userId, name, assets);
    res.json(result);
  } catch (error) {
    console.error('Create watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create watchlist'
    });
  }
});

/**
 * GET /api/v1/alerts/watchlists
 * Get user's watchlists
 */
router.get('/watchlists', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await priceAlertService.getUserWatchlists(userId);
    res.json(result);
  } catch (error) {
    console.error('Get watchlists error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve watchlists'
    });
  }
});

module.exports = router;

