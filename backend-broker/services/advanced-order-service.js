/**
 * Advanced Order Service
 * 
 * Support for advanced order types on REAL Bitcoin trading:
 * - Limit Orders (buy/sell at specific price)
 * - Stop-Loss Orders (sell if price drops below threshold)
 * - Take-Profit Orders (sell if price rises above threshold)
 * - Trailing Stop Orders (dynamic stop-loss)
 * - OCO Orders (One-Cancels-Other)
 * 
 * These orders are monitored and executed automatically
 */

const pool = require('../config/database');
const realTradingService = require('./real-bitcoin-trading-service');
const EventEmitter = require('events');

class AdvancedOrderService extends EventEmitter {
  constructor() {
    super();
    this.monitoringInterval = null;
    this.orderCheckInterval = 5000; // Check every 5 seconds
  }

  /**
   * Create a limit order (buy/sell at specific price)
   * @param {number} userId - User ID
   * @param {string} side - 'buy' or 'sell'
   * @param {number} amount - Amount in GBP (for buy) or BTC (for sell)
   * @param {number} limitPrice - Target price in GBP
   */
  async createLimitOrder(userId, side, amount, limitPrice) {
    try {
      // Validate balance
      const balance = await realTradingService.getUserBalance(userId);
      
      if (side === 'buy' && balance.gbp < amount) {
        return {
          success: false,
          error: `Insufficient GBP balance. Need £${amount}, have £${balance.gbp}`
        };
      }

      if (side === 'sell' && balance.btc < amount) {
        return {
          success: false,
          error: `Insufficient BTC balance. Need ${amount} BTC, have ${balance.btc} BTC`
        };
      }

      // Create order in database
      const result = await pool.query(
        `INSERT INTO advanced_orders (
          user_id, type, side, amount, limit_price, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [userId, 'limit', side, amount, limitPrice, 'pending']
      );

      // Reserve funds
      if (side === 'buy') {
        await pool.query(
          `UPDATE users SET gbp_balance = gbp_balance - $1 WHERE id = $2`,
          [amount, userId]
        );
      } else {
        await pool.query(
          `UPDATE users SET btc_balance = btc_balance - $1 WHERE id = $2`,
          [amount, userId]
        );
      }

      return {
        success: true,
        order: result.rows[0],
        message: `Limit ${side} order created. Will execute when BTC ${side === 'buy' ? 'drops to' : 'rises to'} £${limitPrice}`
      };

    } catch (error) {
      console.error('Create limit order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a stop-loss order (sell if price drops below threshold)
   * @param {number} userId - User ID
   * @param {number} btcAmount - Amount of BTC to sell
   * @param {number} stopPrice - Trigger price in GBP
   */
  async createStopLoss(userId, btcAmount, stopPrice) {
    try {
      const balance = await realTradingService.getUserBalance(userId);
      
      if (balance.btc < btcAmount) {
        return {
          success: false,
          error: `Insufficient BTC balance. Need ${btcAmount} BTC, have ${balance.btc} BTC`
        };
      }

      const result = await pool.query(
        `INSERT INTO advanced_orders (
          user_id, type, side, amount, stop_price, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [userId, 'stop_loss', 'sell', btcAmount, stopPrice, 'pending']
      );

      // Reserve BTC
      await pool.query(
        `UPDATE users SET btc_balance = btc_balance - $1 WHERE id = $2`,
        [btcAmount, userId]
      );

      return {
        success: true,
        order: result.rows[0],
        message: `Stop-loss order created. Will sell ${btcAmount} BTC if price drops below £${stopPrice}`
      };

    } catch (error) {
      console.error('Create stop-loss error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a take-profit order (sell if price rises above threshold)
   * @param {number} userId - User ID
   * @param {number} btcAmount - Amount of BTC to sell
   * @param {number} takeProfitPrice - Target price in GBP
   */
  async createTakeProfit(userId, btcAmount, takeProfitPrice) {
    try {
      const balance = await realTradingService.getUserBalance(userId);
      
      if (balance.btc < btcAmount) {
        return {
          success: false,
          error: `Insufficient BTC balance. Need ${btcAmount} BTC, have ${balance.btc} BTC`
        };
      }

      const result = await pool.query(
        `INSERT INTO advanced_orders (
          user_id, type, side, amount, take_profit_price, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [userId, 'take_profit', 'sell', btcAmount, takeProfitPrice, 'pending']
      );

      // Reserve BTC
      await pool.query(
        `UPDATE users SET btc_balance = btc_balance - $1 WHERE id = $2`,
        [btcAmount, userId]
      );

      return {
        success: true,
        order: result.rows[0],
        message: `Take-profit order created. Will sell ${btcAmount} BTC if price rises above £${takeProfitPrice}`
      };

    } catch (error) {
      console.error('Create take-profit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a trailing stop order (dynamic stop-loss)
   * @param {number} userId - User ID
   * @param {number} btcAmount - Amount of BTC to sell
   * @param {number} trailPercent - Trail percentage (e.g., 5 for 5%)
   */
  async createTrailingStop(userId, btcAmount, trailPercent) {
    try {
      const balance = await realTradingService.getUserBalance(userId);
      
      if (balance.btc < btcAmount) {
        return {
          success: false,
          error: `Insufficient BTC balance. Need ${btcAmount} BTC, have ${balance.btc} BTC`
        };
      }

      // Get current price to set initial trailing stop
      const exchange = realTradingService.getExchangeClient();
      const priceData = await exchange.getCurrentPrice();
      
      if (!priceData.success) {
        return {
          success: false,
          error: 'Failed to get current price'
        };
      }

      const currentPrice = priceData.price;
      const initialStopPrice = currentPrice * (1 - trailPercent / 100);

      const result = await pool.query(
        `INSERT INTO advanced_orders (
          user_id, type, side, amount, stop_price, trail_percent, highest_price, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *`,
        [userId, 'trailing_stop', 'sell', btcAmount, initialStopPrice, trailPercent, currentPrice, 'pending']
      );

      // Reserve BTC
      await pool.query(
        `UPDATE users SET btc_balance = btc_balance - $1 WHERE id = $2`,
        [btcAmount, userId]
      );

      return {
        success: true,
        order: result.rows[0],
        message: `Trailing stop order created. Will sell ${btcAmount} BTC if price drops ${trailPercent}% from peak`
      };

    } catch (error) {
      console.error('Create trailing stop error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's active advanced orders
   */
  async getUserOrders(userId, status = 'pending') {
    try {
      const result = await pool.query(
        `SELECT * FROM advanced_orders 
         WHERE user_id = $1 AND status = $2 
         ORDER BY created_at DESC`,
        [userId, status]
      );

      return {
        success: true,
        orders: result.rows
      };

    } catch (error) {
      console.error('Get user orders error:', error);
      return {
        success: false,
        error: error.message,
        orders: []
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(userId, orderId) {
    try {
      // Get order details
      const orderResult = await pool.query(
        `SELECT * FROM advanced_orders WHERE id = $1 AND user_id = $2`,
        [orderId, userId]
      );

      if (orderResult.rows.length === 0) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      const order = orderResult.rows[0];

      if (order.status !== 'pending') {
        return {
          success: false,
          error: `Cannot cancel order with status: ${order.status}`
        };
      }

      // Return reserved funds
      if (order.side === 'buy') {
        await pool.query(
          `UPDATE users SET gbp_balance = gbp_balance + $1 WHERE id = $2`,
          [order.amount, userId]
        );
      } else {
        await pool.query(
          `UPDATE users SET btc_balance = btc_balance + $1 WHERE id = $2`,
          [order.amount, userId]
        );
      }

      // Update order status
      await pool.query(
        `UPDATE advanced_orders SET status = $1, updated_at = NOW() WHERE id = $2`,
        ['cancelled', orderId]
      );

      return {
        success: true,
        message: 'Order cancelled successfully'
      };

    } catch (error) {
      console.error('Cancel order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start monitoring orders (background process)
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      console.log('Order monitoring already running');
      return;
    }

    console.log('🔍 Starting advanced order monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      await this.checkAndExecuteOrders();
    }, this.orderCheckInterval);
  }

  /**
   * Stop monitoring orders
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏸️  Stopped advanced order monitoring');
    }
  }

  /**
   * Check all pending orders and execute if conditions are met
   */
  async checkAndExecuteOrders() {
    try {
      // Get current BTC price
      const exchange = realTradingService.getExchangeClient();
      const priceData = await exchange.getCurrentPrice();
      
      if (!priceData.success) {
        return;
      }

      const currentPrice = priceData.price;

      // Get all pending orders
      const ordersResult = await pool.query(
        `SELECT * FROM advanced_orders WHERE status = 'pending'`
      );

      for (const order of ordersResult.rows) {
        let shouldExecute = false;

        switch (order.type) {
          case 'limit':
            // Buy limit: execute if current price <= limit price
            // Sell limit: execute if current price >= limit price
            shouldExecute = order.side === 'buy' 
              ? currentPrice <= order.limit_price
              : currentPrice >= order.limit_price;
            break;

          case 'stop_loss':
            // Execute if current price drops below stop price
            shouldExecute = currentPrice <= order.stop_price;
            break;

          case 'take_profit':
            // Execute if current price rises above take-profit price
            shouldExecute = currentPrice >= order.take_profit_price;
            break;

          case 'trailing_stop':
            // Update highest price if current price is higher
            if (currentPrice > order.highest_price) {
              const newStopPrice = currentPrice * (1 - order.trail_percent / 100);
              await pool.query(
                `UPDATE advanced_orders 
                 SET highest_price = $1, stop_price = $2, updated_at = NOW() 
                 WHERE id = $3`,
                [currentPrice, newStopPrice, order.id]
              );
            }
            // Execute if price drops to stop price
            shouldExecute = currentPrice <= order.stop_price;
            break;
        }

        if (shouldExecute) {
          await this.executeOrder(order, currentPrice);
        }
      }

    } catch (error) {
      console.error('Check and execute orders error:', error);
    }
  }

  /**
   * Execute an order
   */
  async executeOrder(order, executionPrice) {
    try {
      console.log(`🎯 Executing ${order.type} order #${order.id} for user ${order.user_id}`);

      let result;

      if (order.side === 'buy') {
        // Buy Bitcoin
        result = await realTradingService.buyBitcoin(order.user_id, order.amount);
      } else {
        // Sell Bitcoin
        result = await realTradingService.sellBitcoin(order.user_id, order.amount);
      }

      if (result.success) {
        // Update order status
        await pool.query(
          `UPDATE advanced_orders 
           SET status = $1, executed_price = $2, executed_at = NOW(), updated_at = NOW() 
           WHERE id = $3`,
          ['executed', executionPrice, order.id]
        );

        // Emit event
        this.emit('orderExecuted', {
          orderId: order.id,
          userId: order.user_id,
          type: order.type,
          side: order.side,
          amount: order.amount,
          executionPrice,
          result
        });

        console.log(`✅ Order #${order.id} executed successfully at £${executionPrice}`);
      } else {
        // Mark as failed and return funds
        await pool.query(
          `UPDATE advanced_orders SET status = $1, updated_at = NOW() WHERE id = $2`,
          ['failed', order.id]
        );

        // Return reserved funds
        if (order.side === 'buy') {
          await pool.query(
            `UPDATE users SET gbp_balance = gbp_balance + $1 WHERE id = $2`,
            [order.amount, order.user_id]
          );
        } else {
          await pool.query(
            `UPDATE users SET btc_balance = btc_balance + $1 WHERE id = $2`,
            [order.amount, order.user_id]
          );
        }

        console.error(`❌ Order #${order.id} execution failed:`, result.error);
      }

    } catch (error) {
      console.error('Execute order error:', error);
      
      // Mark as failed
      await pool.query(
        `UPDATE advanced_orders SET status = $1, updated_at = NOW() WHERE id = $2`,
        ['failed', order.id]
      );
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          type,
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount
         FROM advanced_orders 
         WHERE user_id = $1 
         GROUP BY type, status`,
        [userId]
      );

      return {
        success: true,
        stats: result.rows
      };

    } catch (error) {
      console.error('Get order stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AdvancedOrderService();

