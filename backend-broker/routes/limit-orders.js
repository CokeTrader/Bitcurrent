/**
 * Limit Orders API
 * Advanced order types (limit, stop-loss, take-profit)
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// In-memory storage (replace with database)
const limitOrders = new Map();

/**
 * Create limit order
 * POST /api/v1/limit-orders
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, side, quantity, limitPrice, stopLoss, takeProfit } = req.body;
    
    // Validation
    if (!symbol || !side || !quantity || !limitPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const order = {
      id: `limit_${Date.now()}`,
      userId,
      symbol,
      side,
      quantity: parseFloat(quantity),
      limitPrice: parseFloat(limitPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      status: 'pending',
      filled: 0,
      createdAt: new Date().toISOString(),
      expiresAt: null // Good-till-cancelled
    };
    
    if (!limitOrders.has(userId)) {
      limitOrders.set(userId, []);
    }
    limitOrders.get(userId).push(order);
    
    logger.info('Limit order created', { userId, orderId: order.id, symbol, limitPrice });
    
    res.json({
      success: true,
      order: {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        limitPrice: order.limitPrice,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    logger.error('Create limit order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create limit order'
    });
  }
});

/**
 * Get user's limit orders
 * GET /api/v1/limit-orders
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = limitOrders.get(userId) || [];
    
    const activeOrders = orders.filter(o => o.status === 'pending');
    
    res.json({
      success: true,
      orders: activeOrders
    });
  } catch (error) {
    logger.error('Get limit orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch limit orders'
    });
  }
});

/**
 * Cancel limit order
 * DELETE /api/v1/limit-orders/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    
    const orders = limitOrders.get(userId) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Order already filled or cancelled'
      });
    }
    
    order.status = 'cancelled';
    order.cancelledAt = new Date().toISOString();
    
    logger.info('Limit order cancelled', { userId, orderId });
    
    res.json({
      success: true,
      message: 'Order cancelled'
    });
  } catch (error) {
    logger.error('Cancel limit order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

module.exports = router;

