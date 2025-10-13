/**
 * Analytics Service
 * Track user behavior and trading patterns
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Get user portfolio performance
   */
  static async getPortfolioPerformance(userId, days = 30) {
    try {
      const sql = `
        WITH daily_snapshots AS (
          SELECT 
            DATE(created_at) as date,
            SUM(amount * price) as total_value
          FROM orders
          WHERE user_id = $1
            AND status = 'filled'
            AND created_at >= NOW() - INTERVAL '${days} days'
          GROUP BY DATE(created_at)
          ORDER BY date
        )
        SELECT 
          date,
          total_value,
          LAG(total_value) OVER (ORDER BY date) as previous_value,
          (total_value - LAG(total_value) OVER (ORDER BY date)) / 
            NULLIF(LAG(total_value) OVER (ORDER BY date), 0) * 100 as change_percent
        FROM daily_snapshots
      `;

      const result = await qb.query(sql, [userId]);
      return result;
    } catch (error) {
      logger.error('Failed to get portfolio performance', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get trading statistics
   */
  static async getTradingStats(userId) {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_trades,
          COUNT(CASE WHEN side = 'buy' THEN 1 END) as buy_count,
          COUNT(CASE WHEN side = 'sell' THEN 1 END) as sell_count,
          AVG(amount * price) as avg_trade_size,
          SUM(amount * price) as total_volume,
          SUM(fee) as total_fees,
          COUNT(CASE WHEN status = 'filled' THEN 1 END) as filled_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
        FROM orders
        WHERE user_id = $1
      `;

      const result = await qb.query(sql, [userId]);
      return result[0];
    } catch (error) {
      logger.error('Failed to get trading stats', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate profit/loss
   */
  static async calculateProfitLoss(userId) {
    try {
      // Get all filled orders
      const orders = await qb.select('orders', {
        user_id: userId,
        status: 'filled'
      });

      let totalPnL = 0;
      const positions = {};

      // Calculate P&L by tracking positions
      orders.forEach(order => {
        const symbol = order.pair.split('/')[0];
        
        if (!positions[symbol]) {
          positions[symbol] = {
            amount: 0,
            totalCost: 0,
            realizedPnL: 0
          };
        }

        if (order.side === 'buy') {
          positions[symbol].amount += order.amount;
          positions[symbol].totalCost += order.amount * order.price;
        } else {
          // Selling - realize P&L
          const avgCost = positions[symbol].totalCost / positions[symbol].amount;
          const pnl = (order.price - avgCost) * order.amount;
          positions[symbol].realizedPnL += pnl;
          positions[symbol].amount -= order.amount;
          positions[symbol].totalCost -= avgCost * order.amount;
          totalPnL += pnl;
        }
      });

      return {
        totalPnL,
        positions,
        roi: totalPnL > 0 ? ((totalPnL / 10000) * 100).toFixed(2) : 0 // Assuming $10k initial
      };
    } catch (error) {
      logger.error('Failed to calculate P&L', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get top performing pairs
   */
  static async getTopPairs(userId, limit = 5) {
    try {
      const sql = `
        SELECT 
          pair,
          COUNT(*) as trade_count,
          SUM(amount * price) as total_volume,
          AVG(amount * price) as avg_trade_size
        FROM orders
        WHERE user_id = $1
          AND status = 'filled'
        GROUP BY pair
        ORDER BY total_volume DESC
        LIMIT $2
      `;

      return await qb.query(sql, [userId, limit]);
    } catch (error) {
      logger.error('Failed to get top pairs', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get trading activity heatmap
   */
  static async getTradingHeatmap(userId, days = 90) {
    try {
      const sql = `
        SELECT 
          DATE(created_at) as date,
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as trade_count
        FROM orders
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at)
        ORDER BY date, hour
      `;

      return await qb.query(sql, [userId]);
    } catch (error) {
      logger.error('Failed to get trading heatmap', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Track event for analytics
   */
  static async trackEvent(userId, eventType, metadata = {}) {
    try {
      await qb.insert('analytics_events', {
        user_id: userId,
        event_type: eventType,
        metadata: JSON.stringify(metadata),
        created_at: new Date()
      });

      logger.info('Event tracked', {
        userId,
        eventType,
        metadata
      });
    } catch (error) {
      // Don't throw - tracking should not break user flow
      logger.error('Failed to track event', {
        userId,
        eventType,
        error: error.message
      });
    }
  }

  /**
   * Get platform-wide statistics (admin)
   */
  static async getPlatformStats() {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE kyc_verified = true) as verified_users,
          (SELECT COUNT(*) FROM orders WHERE status = 'filled') as total_trades,
          (SELECT SUM(amount * price) FROM orders WHERE status = 'filled') as total_volume,
          (SELECT SUM(amount) FROM deposits WHERE status = 'completed') as total_deposits,
          (SELECT SUM(amount) FROM withdrawals WHERE status = 'approved') as total_withdrawals
      `;

      const result = await qb.query(sql);
      return result[0];
    } catch (error) {
      logger.error('Failed to get platform stats', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user retention metrics
   */
  static async getRetentionMetrics(cohortDate) {
    try {
      const sql = `
        WITH cohort AS (
          SELECT id, created_at
          FROM users
          WHERE DATE(created_at) = $1
        ),
        activity AS (
          SELECT 
            c.id,
            DATE_PART('day', o.created_at - c.created_at) / 7 as week_number
          FROM cohort c
          LEFT JOIN orders o ON o.user_id = c.id
          WHERE o.created_at IS NOT NULL
        )
        SELECT 
          week_number,
          COUNT(DISTINCT id) as active_users,
          COUNT(DISTINCT id) * 100.0 / (SELECT COUNT(*) FROM cohort) as retention_rate
        FROM activity
        GROUP BY week_number
        ORDER BY week_number
      `;

      return await qb.query(sql, [cohortDate]);
    } catch (error) {
      logger.error('Failed to get retention metrics', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = AnalyticsService;

