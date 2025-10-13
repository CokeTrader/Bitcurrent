/**
 * Order Service
 * Business logic for order management (extracted from routes)
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const AlpacaService = require('./alpaca-service');
const logger = require('../utils/logger');

class OrderService {
  /**
   * Get user's orders with filtering
   */
  static async getUserOrders(userId, options = {}) {
    const { status, pair, limit = 50, offset = 0 } = options;
    
    let conditions = { user_id: userId };
    if (status) conditions.status = status;
    if (pair) conditions.pair = pair;
    
    const sql = `
      SELECT * FROM orders
      WHERE user_id = $1
      ${status ? 'AND status = $2' : ''}
      ${pair ? `AND pair = $${status ? 3 : 2}` : ''}
      ORDER BY created_at DESC
      LIMIT $${Object.keys(conditions).length + 1}
      OFFSET $${Object.keys(conditions).length + 2}
    `;
    
    const params = [userId];
    if (status) params.push(status);
    if (pair) params.push(pair);
    params.push(limit, offset);
    
    return await qb.query(sql, params);
  }

  /**
   * Get order by ID (ensure user owns it)
   */
  static async getOrderById(orderId, userId) {
    const orders = await qb.select('orders', { id: orderId, user_id: userId });
    return orders[0] || null;
  }

  /**
   * Create new order
   */
  static async createOrder(orderData) {
    const { userId, pair, side, amount, price, type } = orderData;
    
    // Validate user has sufficient balance
    const hasBalance = await this.checkUserBalance(userId, pair, side, amount, price);
    if (!hasBalance) {
      throw new Error('Insufficient balance');
    }
    
    // Place order with Alpaca
    let alpacaOrder;
    try {
      alpacaOrder = await AlpacaService.placeOrder({
        symbol: pair.replace('/', ''),
        qty: amount,
        side,
        type,
        limit_price: type === 'limit' ? price : undefined
      });
    } catch (error) {
      logger.error('Alpaca order failed', { error: error.message, orderData });
      throw new Error('Failed to place order with exchange');
    }
    
    // Record order in database
    const order = await qb.insert('orders', {
      user_id: userId,
      pair,
      side,
      amount,
      price: price || null,
      type,
      status: 'pending',
      alpaca_order_id: alpacaOrder.id,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    return order;
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId, userId) {
    // Get order
    const order = await this.getOrderById(orderId, userId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (!['pending', 'open'].includes(order.status)) {
      return false; // Cannot cancel
    }
    
    // Cancel with Alpaca
    try {
      await AlpacaService.cancelOrder(order.alpaca_order_id);
    } catch (error) {
      logger.error('Alpaca cancel failed', { error: error.message, orderId });
      throw new Error('Failed to cancel order with exchange');
    }
    
    // Update database
    await qb.update('orders', 
      { status: 'cancelled', updated_at: new Date() },
      { id: orderId }
    );
    
    return true;
  }

  /**
   * Get all open orders for user
   */
  static async getOpenOrders(userId) {
    return await qb.select('orders', { 
      user_id: userId, 
      status: 'open' 
    });
  }

  /**
   * Amend existing order
   */
  static async amendOrder(orderId, userId, changes) {
    const order = await this.getOrderById(orderId, userId);
    
    if (!order || order.status !== 'open') {
      return false;
    }
    
    // Cancel and replace with Alpaca
    try {
      await AlpacaService.cancelOrder(order.alpaca_order_id);
      
      const newOrder = await AlpacaService.placeOrder({
        symbol: order.pair.replace('/', ''),
        qty: changes.amount || order.amount,
        side: order.side,
        type: order.type,
        limit_price: changes.price || order.price
      });
      
      // Update database
      return await qb.update('orders',
        {
          amount: changes.amount || order.amount,
          price: changes.price || order.price,
          alpaca_order_id: newOrder.id,
          updated_at: new Date()
        },
        { id: orderId }
      );
    } catch (error) {
      logger.error('Order amendment failed', { error: error.message, orderId });
      throw new Error('Failed to amend order');
    }
  }

  /**
   * Check if user has sufficient balance
   */
  static async checkUserBalance(userId, pair, side, amount, price) {
    const [base, quote] = pair.split('/');
    
    // Get user balances
    const balances = await qb.select('balances', { user_id: userId });
    const balanceMap = {};
    balances.forEach(b => {
      balanceMap[b.currency] = parseFloat(b.available);
    });
    
    if (side === 'buy') {
      // Need quote currency
      const required = amount * (price || 0); // For limit orders
      return balanceMap[quote] >= required;
    } else {
      // Need base currency
      return balanceMap[base] >= amount;
    }
  }
}

module.exports = OrderService;

