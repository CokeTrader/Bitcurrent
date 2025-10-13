/**
 * Orders Routes - Refactored
 * Breaking down monolithic route into modular services
 */

const express = require('express');
const router = express.Router();
const { financialOperationAuth } = require('../middleware/advanced-auth');
const { validateTradeRequest } = require('../middleware/input-sanitizer');
const { smartCsrfProtection } = require('../middleware/csrf-protection');
const OrderService = require('../services/order-service');
const logger = require('../utils/logger');

/**
 * GET /api/v1/orders
 * List user's orders with pagination and filtering
 */
router.get('/', financialOperationAuth, async (req, res, next) => {
  try {
    const { status, pair, limit = 50, offset = 0 } = req.query;
    
    const orders = await OrderService.getUserOrders(req.userId, {
      status,
      pair,
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      orders,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: orders.length === parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Failed to fetch orders', { userId: req.userId, error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/orders/:orderId
 * Get specific order details
 */
router.get('/:orderId', financialOperationAuth, async (req, res, next) => {
  try {
    const order = await OrderService.getOrderById(req.params.orderId, req.userId);
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    logger.error('Failed to fetch order', { orderId: req.params.orderId, error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/orders
 * Create new order (market or limit)
 */
router.post('/', 
  smartCsrfProtection,
  financialOperationAuth, 
  validateTradeRequest,
  async (req, res, next) => {
    try {
      const { pair, side, amount, price, type } = req.body;
      
      // Create order
      const order = await OrderService.createOrder({
        userId: req.userId,
        pair,
        side,
        amount,
        price,
        type
      });
      
      logger.info('Order created', {
        userId: req.userId,
        orderId: order.id,
        pair,
        side,
        amount,
        type
      });
      
      res.status(201).json({
        success: true,
        order,
        message: 'Order created successfully'
      });
    } catch (error) {
      logger.error('Failed to create order', { 
        userId: req.userId, 
        body: req.body,
        error: error.message 
      });
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/orders/:orderId
 * Cancel an order
 */
router.delete('/:orderId',
  smartCsrfProtection,
  financialOperationAuth,
  async (req, res, next) => {
    try {
      const cancelled = await OrderService.cancelOrder(req.params.orderId, req.userId);
      
      if (!cancelled) {
        return res.status(400).json({
          error: 'Order cannot be cancelled (already filled or cancelled)',
          code: 'CANNOT_CANCEL'
        });
      }
      
      logger.info('Order cancelled', {
        userId: req.userId,
        orderId: req.params.orderId
      });
      
      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      logger.error('Failed to cancel order', {
        userId: req.userId,
        orderId: req.params.orderId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/orders/open
 * Get all open orders for user
 */
router.get('/status/open', financialOperationAuth, async (req, res, next) => {
  try {
    const openOrders = await OrderService.getOpenOrders(req.userId);
    
    res.json({
      success: true,
      orders: openOrders,
      count: openOrders.length
    });
  } catch (error) {
    logger.error('Failed to fetch open orders', { userId: req.userId, error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/orders/:orderId/amend
 * Amend an existing order (price/amount)
 */
router.post('/:orderId/amend',
  smartCsrfProtection,
  financialOperationAuth,
  async (req, res, next) => {
    try {
      const { price, amount } = req.body;
      
      const amended = await OrderService.amendOrder(req.params.orderId, req.userId, {
        price,
        amount
      });
      
      if (!amended) {
        return res.status(400).json({
          error: 'Order cannot be amended',
          code: 'CANNOT_AMEND'
        });
      }
      
      logger.info('Order amended', {
        userId: req.userId,
        orderId: req.params.orderId,
        changes: { price, amount }
      });
      
      res.json({
        success: true,
        order: amended,
        message: 'Order amended successfully'
      });
    } catch (error) {
      logger.error('Failed to amend order', {
        userId: req.userId,
        orderId: req.params.orderId,
        error: error.message
      });
      next(error);
    }
  }
);

module.exports = router;

