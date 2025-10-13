/**
 * Social Trading Service
 * 
 * Copy trading and social features:
 * - Follow successful traders
 * - Copy their trades automatically
 * - Leaderboards
 * - Performance rankings
 * - Social profiles
 * - Trade sharing
 */

const pool = require('../config/database');
const multiAssetService = require('./multi-asset-trading-service');

class SocialTradingService {
  
  /**
   * Get top traders leaderboard
   */
  async getLeaderboard(period = '30d', limit = 100) {
    try {
      const days = this.periodToDays(period);

      const result = await pool.query(
        `SELECT 
          u.id as user_id,
          u.email,
          u.username,
          COUNT(t.id) as trade_count,
          SUM(CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
          SUM(t.pnl) as total_pnl,
          AVG(t.pnl) as avg_pnl,
          MAX(t.pnl) as best_trade,
          (SUM(CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END)::FLOAT / 
           NULLIF(COUNT(t.id), 0) * 100) as win_rate
         FROM users u
         JOIN trades t ON u.id = t.user_id
         WHERE t.created_at >= NOW() - INTERVAL '${days} days'
         AND t.side = 'sell'
         GROUP BY u.id, u.email, u.username
         HAVING COUNT(t.id) >= 5
         ORDER BY total_pnl DESC
         LIMIT $1`,
        [limit]
      );

      return {
        success: true,
        leaderboard: result.rows.map((row, index) => ({
          rank: index + 1,
          userId: row.user_id,
          username: row.username || `Trader${row.user_id}`,
          tradeCount: parseInt(row.trade_count),
          winningTrades: parseInt(row.winning_trades),
          totalPnL: parseFloat(row.total_pnl || 0),
          avgPnL: parseFloat(row.avg_pnl || 0),
          bestTrade: parseFloat(row.best_trade || 0),
          winRate: parseFloat(row.win_rate || 0).toFixed(2) + '%',
          followers: 0 // Will be populated from followers table
        }))
      };

    } catch (error) {
      console.error('Get leaderboard error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get trader profile
   */
  async getTraderProfile(traderId) {
    try {
      // Get basic stats
      const statsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_trades,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) as avg_pnl,
          MAX(pnl) as best_trade,
          MIN(pnl) as worst_trade
         FROM trades
         WHERE user_id = $1 AND side = 'sell'`,
        [traderId]
      );

      const stats = statsResult.rows[0];

      // Get follower count
      const followersResult = await pool.query(
        `SELECT COUNT(*) as follower_count FROM social_follows WHERE followed_id = $1`,
        [traderId]
      );

      // Get recent trades (public)
      const tradesResult = await pool.query(
        `SELECT 
          symbol,
          side,
          quantity,
          price,
          pnl,
          created_at
         FROM trades
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [traderId]
      );

      const totalTrades = parseInt(stats.total_trades || 0);
      const winningTrades = parseInt(stats.winning_trades || 0);

      return {
        success: true,
        profile: {
          traderId,
          stats: {
            totalTrades,
            winningTrades,
            winRate: totalTrades > 0 
              ? ((winningTrades / totalTrades) * 100).toFixed(2) + '%'
              : '0%',
            totalPnL: parseFloat(stats.total_pnl || 0),
            avgPnL: parseFloat(stats.avg_pnl || 0),
            bestTrade: parseFloat(stats.best_trade || 0),
            worstTrade: parseFloat(stats.worst_trade || 0)
          },
          followers: parseInt(followersResult.rows[0].follower_count || 0),
          recentTrades: tradesResult.rows.map(trade => ({
            symbol: trade.symbol,
            side: trade.side,
            quantity: parseFloat(trade.quantity),
            price: parseFloat(trade.price),
            pnl: trade.pnl ? parseFloat(trade.pnl) : null,
            date: trade.created_at
          }))
        }
      };

    } catch (error) {
      console.error('Get trader profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Follow a trader
   */
  async followTrader(followerId, traderId) {
    try {
      // Check if already following
      const existingResult = await pool.query(
        `SELECT id FROM social_follows WHERE follower_id = $1 AND followed_id = $2`,
        [followerId, traderId]
      );

      if (existingResult.rows.length > 0) {
        return {
          success: false,
          error: 'Already following this trader'
        };
      }

      // Create follow relationship
      await pool.query(
        `INSERT INTO social_follows (follower_id, followed_id, created_at)
         VALUES ($1, $2, NOW())`,
        [followerId, traderId]
      );

      return {
        success: true,
        message: 'Successfully followed trader'
      };

    } catch (error) {
      console.error('Follow trader error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unfollow a trader
   */
  async unfollowTrader(followerId, traderId) {
    try {
      const result = await pool.query(
        `DELETE FROM social_follows 
         WHERE follower_id = $1 AND followed_id = $2
         RETURNING id`,
        [followerId, traderId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Not following this trader'
        };
      }

      return {
        success: true,
        message: 'Successfully unfollowed trader'
      };

    } catch (error) {
      console.error('Unfollow trader error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enable copy trading for a followed trader
   */
  async enableCopyTrading(followerId, traderId, config) {
    try {
      const { copyPercentage, maxAmountPerTrade, stopLoss } = config;

      // Validate config
      if (!copyPercentage || copyPercentage < 1 || copyPercentage > 100) {
        return {
          success: false,
          error: 'Copy percentage must be between 1 and 100'
        };
      }

      // Check if following
      const followResult = await pool.query(
        `SELECT id FROM social_follows WHERE follower_id = $1 AND followed_id = $2`,
        [followerId, traderId]
      );

      if (followResult.rows.length === 0) {
        return {
          success: false,
          error: 'Must follow trader before enabling copy trading'
        };
      }

      // Create or update copy trading config
      await pool.query(
        `INSERT INTO copy_trading (
          follower_id, trader_id, copy_percentage, max_amount_per_trade, 
          stop_loss, enabled, created_at
        ) VALUES ($1, $2, $3, $4, $5, true, NOW())
        ON CONFLICT (follower_id, trader_id) 
        DO UPDATE SET 
          copy_percentage = $3,
          max_amount_per_trade = $4,
          stop_loss = $5,
          enabled = true,
          updated_at = NOW()`,
        [followerId, traderId, copyPercentage, maxAmountPerTrade, stopLoss]
      );

      return {
        success: true,
        message: 'Copy trading enabled',
        config: {
          copyPercentage,
          maxAmountPerTrade,
          stopLoss
        }
      };

    } catch (error) {
      console.error('Enable copy trading error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disable copy trading
   */
  async disableCopyTrading(followerId, traderId) {
    try {
      await pool.query(
        `UPDATE copy_trading 
         SET enabled = false, updated_at = NOW()
         WHERE follower_id = $1 AND trader_id = $2`,
        [followerId, traderId]
      );

      return {
        success: true,
        message: 'Copy trading disabled'
      };

    } catch (error) {
      console.error('Disable copy trading error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute copy trade (triggered when followed trader makes a trade)
   */
  async executeCopyTrade(traderId, tradeData) {
    try {
      // Get all followers with copy trading enabled
      const followersResult = await pool.query(
        `SELECT 
          ct.follower_id,
          ct.copy_percentage,
          ct.max_amount_per_trade,
          ct.stop_loss
         FROM copy_trading ct
         WHERE ct.trader_id = $1 AND ct.enabled = true`,
        [traderId]
      );

      for (const follower of followersResult.rows) {
        // Calculate copy amount
        const originalAmount = tradeData.amount;
        const copyAmount = (originalAmount * follower.copy_percentage) / 100;
        const finalAmount = follower.max_amount_per_trade 
          ? Math.min(copyAmount, follower.max_amount_per_trade)
          : copyAmount;

        // Execute trade for follower
        if (tradeData.side === 'buy') {
          await multiAssetService.buyAsset(
            follower.follower_id,
            tradeData.asset,
            finalAmount
          );
        } else {
          await multiAssetService.sellAsset(
            follower.follower_id,
            tradeData.asset,
            finalAmount
          );
        }

        // Log copy trade
        await pool.query(
          `INSERT INTO copy_trade_history (
            follower_id, trader_id, original_trade_id, 
            asset, side, amount, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            follower.follower_id,
            traderId,
            tradeData.tradeId,
            tradeData.asset,
            tradeData.side,
            finalAmount
          ]
        );
      }

      return {
        success: true,
        copiedTo: followersResult.rows.length
      };

    } catch (error) {
      console.error('Execute copy trade error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's following list
   */
  async getFollowing(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          sf.followed_id as trader_id,
          u.username,
          ct.enabled as copy_trading_enabled,
          ct.copy_percentage
         FROM social_follows sf
         JOIN users u ON sf.followed_id = u.id
         LEFT JOIN copy_trading ct ON sf.follower_id = ct.follower_id 
           AND sf.followed_id = ct.trader_id
         WHERE sf.follower_id = $1
         ORDER BY sf.created_at DESC`,
        [userId]
      );

      return {
        success: true,
        following: result.rows.map(row => ({
          traderId: row.trader_id,
          username: row.username || `Trader${row.trader_id}`,
          copyTradingEnabled: row.copy_trading_enabled || false,
          copyPercentage: row.copy_percentage || 0
        }))
      };

    } catch (error) {
      console.error('Get following error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper: Convert period to days
   */
  periodToDays(period) {
    const map = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': 9999
    };
    return map[period] || 30;
  }
}

module.exports = new SocialTradingService();

