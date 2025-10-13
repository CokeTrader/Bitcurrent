/**
 * Multi-Asset Trading Routes
 * 
 * Trade ETH, SOL, and other cryptocurrencies
 */

const express = require('express');
const router = express.Router();
const multiAssetService = require('../services/multi-asset-trading-service');
const { authenticateToken } = require('../middleware/api-auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/multi-asset/assets
 * Get list of supported assets
 */
router.get('/assets', async (req, res) => {
  try {
    const assets = multiAssetService.getSupportedAssets();
    res.json({
      success: true,
      assets
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve assets'
    });
  }
});

/**
 * GET /api/v1/multi-asset/prices
 * Get current prices for all assets
 */
router.get('/prices', async (req, res) => {
  try {
    const result = await multiAssetService.getAllPrices();
    res.json(result);
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve prices'
    });
  }
});

/**
 * POST /api/v1/multi-asset/buy
 * Buy cryptocurrency
 * Body: { symbol: "ETH", gbpAmount: 100 }
 */
router.post('/buy', async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, gbpAmount } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Asset symbol required'
      });
    }

    if (!gbpAmount || gbpAmount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Minimum purchase is £1'
      });
    }

    const result = await multiAssetService.buyAsset(
      userId,
      symbol,
      gbpAmount
    );

    res.json(result);
  } catch (error) {
    console.error('Buy asset error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to buy asset'
    });
  }
});

/**
 * POST /api/v1/multi-asset/sell
 * Sell cryptocurrency
 * Body: { symbol: "ETH", amount: 0.5 }
 */
router.post('/sell', async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, amount } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Asset symbol required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const result = await multiAssetService.sellAsset(
      userId,
      symbol,
      amount
    );

    res.json(result);
  } catch (error) {
    console.error('Sell asset error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sell asset'
    });
  }
});

/**
 * GET /api/v1/multi-asset/portfolio
 * Get complete portfolio with all assets
 */
router.get('/portfolio', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await multiAssetService.getMultiAssetPortfolio(userId);
    
    res.json(result);
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve portfolio'
    });
  }
});

/**
 * GET /api/v1/multi-asset/balance
 * Get user's balances for all assets
 */
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await multiAssetService.getUserBalance(userId);
    
    res.json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve balance'
    });
  }
});

/**
 * GET /api/v1/multi-asset/price/:symbol
 * Get current price for specific asset
 */
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const result = await multiAssetService.getAssetPrice(symbol.toUpperCase());
    
    res.json(result);
  } catch (error) {
    console.error('Get price error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve price'
    });
  }
});

module.exports = router;

