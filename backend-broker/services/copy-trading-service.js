/**
 * Copy Trading Service
 * Allow users to automatically copy successful traders
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');
const OrderService = require('./order-service');

class CopyTradingService {
  /**
   * Follow a trader (enable copy trading)
   */
  static async followTrader(followerId, traderId, settings) {
    const { copyRatio, maxPositionSize, stopLoss } = settings;

    // Validate trader exists and has good performance
    const trader = await this.getTraderStats(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    // Create copy relationship
    const follow = await qb.insert('copy_trading_follows', {
      follower_id: followerId,
      trader_id: traderId,
      copy_ratio: copyRatio || 0.1, // Default 10% of trader's position
      max_position_size: maxPositionSize || 1000,
      stop_loss_percent: stopLoss || 10,
      status: 'active',
      created_at: new Date()
    });

    logger.info('User started following trader', {
      followerId,
      traderId,
      copyRatio
    });

    return follow;
  }

  /**
   * Unfollow trader
   */
  static async unfollowTrader(followerId, traderId) {
    await qb.update('copy_trading_follows',
      { status: 'inactive', unfollowed_at: new Date() },
      { follower_id: followerId, trader_id: traderId }
    );

    logger.info('User unfollowed trader', { followerId, traderId });
    return true;
  }

  /**
   * Mirror trader's order (automatic copying)
   */
  static async mirrorOrder(originalOrder) {
    try {
      // Get followers of this trader
      const followers = await qb.select('copy_trading_follows', {
        trader_id: originalOrder.user_id,
        status: 'active'
      });

      for (const follower of followers) {
        try {
          // Calculate follower's order size based on copy ratio
          const followerAmount = originalOrder.amount * follower.copy_ratio;

          // Check if within max position size
          if (followerAmount * originalOrder.price > follower.max_position_size) {
            logger.warn('Copy order exceeds max position size', {
              followerId: follower.follower_id,
              maxSize: follower.max_position_size
            });
            continue;
          }

          // Place mirror order
          const mirrorOrder = await OrderService.createOrder({
            userId: follower.follower_id,
            pair: originalOrder.pair,
            side: originalOrder.side,
            amount: followerAmount,
            price: originalOrder.price,
            type: originalOrder.type
          });

          // Record copy relationship
          await qb.insert('copy_trades', {
            follower_id: follower.follower_id,
            trader_id: originalOrder.user_id,
            original_order_id: originalOrder.id,
            copied_order_id: mirrorOrder.id,
            copy_ratio: follower.copy_ratio,
            created_at: new Date()
          });

          logger.info('Order mirrored via copy trading', {
            traderId: originalOrder.user_id,
            followerId: follower.follower_id,
            orderId: mirrorOrder.id
          });
        } catch (error) {
          logger.error('Failed to mirror order for follower', {
            followerId: follower.follower_id,
            error: error.message
          });
          // Continue with other followers
        }
      }
    } catch (error) {
      logger.error('Mirror order process failed', {
        originalOrderId: originalOrder.id,
        error: error.message
      });
    }
  }

  /**
   * Get trader leaderboard
   */
  static async getTraderLeaderboard(period = '30d', limit = 100) {
    const sql = `
      SELECT 
        u.id as trader_id,
        u.email,
        COUNT(DISTINCT cf.follower_id) as followers_count,
        COUNT(o.id) as total_trades,
        AVG(CASE WHEN o.side = 'sell' THEN o.amount * o.price - buy_cost ELSE NULL END) as avg_profit,
        SUM(CASE WHEN o.side = 'sell' AND o.amount * o.price > buy_cost THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(CASE WHEN o.side = 'sell' THEN 1 END), 0) as win_rate
      FROM users u
      JOIN orders o ON o.user_id = u.id
      LEFT JOIN copy_trading_follows cf ON cf.trader_id = u.id AND cf.status = 'active'
      WHERE o.created_at >= NOW() - INTERVAL '${period}'
        AND o.status = 'filled'
      GROUP BY u.id, u.email
      HAVING COUNT(o.id) >= 10
      ORDER BY win_rate DESC, followers_count DESC
      LIMIT $1
    `;

    return await qb.query(sql, [limit]);
  }

  /**
   * Get trader detailed stats
   */
  static async getTraderStats(traderId) {
    const sql = `
      SELECT 
        COUNT(*) as total_trades,
        AVG(amount * price) as avg_trade_size,
        SUM(CASE WHEN side = 'sell' THEN amount * price ELSE 0 END) - 
          SUM(CASE WHEN side = 'buy' THEN amount * price ELSE 0 END) as total_pnl,
        COUNT(CASE WHEN side = 'sell' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(*), 0) as win_rate
      FROM orders
      WHERE user_id = $1 
        AND status = 'filled'
        AND created_at >= NOW() - INTERVAL '90 days'
    `;

    const stats = await qb.query(sql, [traderId]);
    
    // Get followers count
    const followers = await qb.query(
      'SELECT COUNT(*) as count FROM copy_trading_follows WHERE trader_id = $1 AND status = \'active\'',
      [traderId]
    );

    return {
      ...stats[0],
      followers: parseInt(followers[0]?.count || 0)
    };
  }

  /**
   * Get follower's copy trading performance
   */
  static async getCopyTradingPerformance(followerId) {
    const sql = `
      SELECT 
        t.trader_id,
        u.email as trader_email,
        COUNT(ct.id) as copied_trades,
        SUM(CASE WHEN co.status = 'filled' THEN 1 ELSE 0 END) as filled_trades,
        AVG(co.amount * co.price) as avg_copied_amount
      FROM copy_trading_follows t
      JOIN users u ON u.id = t.trader_id
      LEFT JOIN copy_trades ct ON ct.follower_id = t.follower_id AND ct.trader_id = t.trader_id
      LEFT JOIN orders co ON co.id = ct.copied_order_id
      WHERE t.follower_id = $1
      GROUP BY t.trader_id, u.email
    `;

    return await qb.query(sql, [followerId]);
  }
}

module.exports = CopyTradingService;

