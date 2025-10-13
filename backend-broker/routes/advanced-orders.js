/**
 * Advanced Orders API Routes
 * 
 * Endpoints for creating and managing advanced order types
 */

const express = require('express');
const router = express.Router();
const advancedOrderService = require('../services/advanced-order-service');
const { authenticateToken } = require('../middleware/api-auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/v1/advanced-orders/limit
 * Create a limit order
 */
router.post('/limit', async (req, res) => {
  try {
    const userId = req.user.id;
    const { side, amount, limitPrice } = req.body;

    // Validation
    if (!side || !['buy', 'sell'].includes(side)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid side. Must be "buy" or "sell"'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    if (!limitPrice || limitPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit price'
      });
    }

    const result = await advancedOrderService.createLimitOrder(
      userId,
      side,
      amount,
      limitPrice
    );

    res.json(result);
  } catch (error) {
    console.error('Create limit order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create limit order'
    });
  }
});

/**
 * POST /api/v1/advanced-orders/stop-loss
 * Create a stop-loss order
 */
router.post('/stop-loss', async (req, res) => {
  try {
    const userId = req.user.id;
    const { btcAmount, stopPrice } = req.body;

    if (!btcAmount || btcAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid BTC amount'
      });
    }

    if (!stopPrice || stopPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stop price'
      });
    }

    const result = await advancedOrderService.createStopLoss(
      userId,
      btcAmount,
      stopPrice
    );

    res.json(result);
  } catch (error) {
    console.error('Create stop-loss error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stop-loss order'
    });
  }
});

/**
 * POST /api/v1/advanced-orders/take-profit
 * Create a take-profit order
 */
router.post('/take-profit', async (req, res) => {
  try {
    const userId = req.user.id;
    const { btcAmount, takeProfitPrice } = req.body;

    if (!btcAmount || btcAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid BTC amount'
      });
    }

    if (!takeProfitPrice || takeProfitPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid take-profit price'
      });
    }

    const result = await advancedOrderService.createTakeProfit(
      userId,
      btcAmount,
      takeProfitPrice
    );

    res.json(result);
  } catch (error) {
    console.error('Create take-profit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create take-profit order'
    });
  }
});

/**
 * POST /api/v1/advanced-orders/trailing-stop
 * Create a trailing stop order
 */
router.post('/trailing-stop', async (req, res) => {
  try {
    const userId = req.user.id;
    const { btcAmount, trailPercent } = req.body;

    if (!btcAmount || btcAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid BTC amount'
      });
    }

    if (!trailPercent || trailPercent <= 0 || trailPercent > 50) {
      return res.status(400).json({
        success: false,
        error: 'Invalid trail percent. Must be between 0 and 50'
      });
    }

    const result = await advancedOrderService.createTrailingStop(
      userId,
      btcAmount,
      trailPercent
    );

    res.json(result);
  } catch (error) {
    console.error('Create trailing stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create trailing stop order'
    });
  }
});

/**
 * GET /api/v1/advanced-orders
 * Get user's advanced orders
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const result = await advancedOrderService.getUserOrders(
      userId,
      status || 'pending'
    );

    res.json(result);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders'
    });
  }
});

/**
 * DELETE /api/v1/advanced-orders/:orderId
 * Cancel an order
 */
router.delete('/:orderId', async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.orderId);

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    const result = await advancedOrderService.cancelOrder(userId, orderId);

    res.json(result);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

/**
 * GET /api/v1/advanced-orders/stats
 * Get order statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await advancedOrderService.getOrderStats(userId);

    res.json(result);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve order statistics'
    });
  }
});

module.exports = router;

