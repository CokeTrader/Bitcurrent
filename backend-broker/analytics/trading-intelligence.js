/**
 * Trading Intelligence & Pattern Recognition
 * Advanced analytics for trading insights
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');

class TradingIntelligence {
  /**
   * Identify trading patterns
   */
  static async identifyPatterns(userId, days = 90) {
    const patterns = {
      dayTrading: await this.detectDayTrading(userId, days),
      swingTrading: await this.detectSwingTrading(userId, days),
      scalping: await this.detectScalping(userId, days),
      hodling: await this.detectHodling(userId, days)
    };

    // Determine primary strategy
    const scores = Object.entries(patterns);
    const primaryStrategy = scores.reduce((max, curr) => 
      curr[1] > max[1] ? curr : max
    );

    return {
      patterns,
      primaryStrategy: primaryStrategy[0],
      confidence: primaryStrategy[1]
    };
  }

  /**
   * Detect day trading pattern
   */
  static async detectDayTrading(userId, days) {
    // Same-day buy and sell
    const sql = `
      SELECT COUNT(*) as count
      FROM orders buy
      JOIN orders sell ON sell.user_id = buy.user_id
        AND sell.pair = buy.pair
        AND DATE(sell.created_at) = DATE(buy.created_at)
        AND sell.side = 'sell'
      WHERE buy.user_id = $1
        AND buy.side = 'buy'
        AND buy.created_at >= NOW() - INTERVAL '${days} days'
    `;

    const result = await qb.query(sql, [userId]);
    return Math.min(parseInt(result[0]?.count || 0) / days * 100, 100);
  }

  /**
   * Detect swing trading pattern
   */
  static async detectSwingTrading(userId, days) {
    // Hold positions for 2-7 days
    const sql = `
      SELECT COUNT(*) as count
      FROM orders buy
      JOIN orders sell ON sell.user_id = buy.user_id
        AND sell.pair = buy.pair
        AND sell.side = 'sell'
        AND sell.created_at - buy.created_at BETWEEN INTERVAL '2 days' AND INTERVAL '7 days'
      WHERE buy.user_id = $1
        AND buy.side = 'buy'
        AND buy.created_at >= NOW() - INTERVAL '${days} days'
    `;

    const result = await qb.query(sql, [userId]);
    return Math.min(parseInt(result[0]?.count || 0) / days * 50, 100);
  }

  /**
   * Detect scalping pattern
   */
  static async detectScalping(userId, days) {
    // Very short holds (<1 hour)
    const sql = `
      SELECT COUNT(*) as count
      FROM orders buy
      JOIN orders sell ON sell.user_id = buy.user_id
        AND sell.pair = buy.pair
        AND sell.side = 'sell'
        AND sell.created_at - buy.created_at < INTERVAL '1 hour'
      WHERE buy.user_id = $1
        AND buy.side = 'buy'
        AND buy.created_at >= NOW() - INTERVAL '${days} days'
    `;

    const result = await qb.query(sql, [userId]);
    return Math.min(parseInt(result[0]?.count || 0) / days * 200, 100);
  }

  /**
   * Detect HODL pattern
   */
  static async detectHodling(userId, days) {
    // Long-term holds (>30 days)
    const sql = `
      SELECT COUNT(*) as count
      FROM orders buy
      LEFT JOIN orders sell ON sell.user_id = buy.user_id
        AND sell.pair = buy.pair
        AND sell.side = 'sell'
        AND sell.created_at > buy.created_at
      WHERE buy.user_id = $1
        AND buy.side = 'buy'
        AND sell.id IS NULL
        AND buy.created_at < NOW() - INTERVAL '30 days'
    `;

    const result = await qb.query(sql, [userId]);
    return Math.min(parseInt(result[0]?.count || 0) * 20, 100);
  }

  /**
   * Get personalized trading insights
   */
  static async getInsights(userId) {
    const insights = [];

    // Win rate analysis
    const winRate = await this.calculateWinRate(userId);
    if (winRate < 40) {
      insights.push({
        type: 'warning',
        title: 'Low Win Rate',
        message: `Your win rate is ${winRate.toFixed(1)}%. Consider reviewing your strategy.`,
        recommendation: 'Try setting stop-loss orders to limit losses.'
      });
    }

    // Risk analysis
    const avgPositionSize = await this.getAvgPositionSize(userId);
    const totalBalance = 10000; // Fetch from balances
    const positionRisk = (avgPositionSize / totalBalance) * 100;

    if (positionRisk > 20) {
      insights.push({
        type: 'warning',
        title: 'High Position Risk',
        message: `You're risking ${positionRisk.toFixed(1)}% per trade.`,
        recommendation: 'Consider reducing position sizes to 1-2% of portfolio.'
      });
    }

    // Trading frequency
    const tradesPerDay = await this.getTradesPerDay(userId);
    if (tradesPerDay > 20) {
      insights.push({
        type: 'info',
        title: 'High Trading Frequency',
        message: `You average ${tradesPerDay.toFixed(1)} trades per day.`,
        recommendation: 'Watch out for trading fees eating into profits.'
      });
    }

    // Best performing pair
    const bestPair = await this.getBestPerformingPair(userId);
    if (bestPair) {
      insights.push({
        type: 'success',
        title: 'Best Performing Asset',
        message: `${bestPair.pair} is your best performer with +${bestPair.profit.toFixed(2)}% return.`,
        recommendation: 'Consider your allocation strategy.'
      });
    }

    return insights;
  }

  /**
   * Calculate win rate
   */
  static async calculateWinRate(userId) {
    const sql = `
      SELECT 
        COUNT(CASE WHEN profit > 0 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as win_rate
      FROM (
        SELECT 
          pair,
          SUM(CASE WHEN side = 'buy' THEN -amount * price ELSE amount * price END) as profit
        FROM orders
        WHERE user_id = $1 AND status = 'filled'
        GROUP BY pair
      ) AS trade_pairs
    `;

    const result = await qb.query(sql, [userId]);
    return parseFloat(result[0]?.win_rate || 0);
  }

  /**
   * Get average position size
   */
  static async getAvgPositionSize(userId) {
    const sql = `
      SELECT AVG(amount * price) as avg_size
      FROM orders
      WHERE user_id = $1 AND status = 'filled'
    `;

    const result = await qb.query(sql, [userId]);
    return parseFloat(result[0]?.avg_size || 0);
  }

  /**
   * Get trades per day
   */
  static async getTradesPerDay(userId) {
    const sql = `
      SELECT COUNT(*) * 1.0 / NULLIF(DATE_PART('day', MAX(created_at) - MIN(created_at)), 0) as per_day
      FROM orders
      WHERE user_id = $1 AND status = 'filled'
    `;

    const result = await qb.query(sql, [userId]);
    return parseFloat(result[0]?.per_day || 0);
  }

  /**
   * Get best performing pair
   */
  static async getBestPerformingPair(userId) {
    const sql = `
      SELECT 
        pair,
        SUM(CASE WHEN side = 'buy' THEN -amount * price ELSE amount * price END) as profit,
        SUM(CASE WHEN side = 'buy' THEN amount * price ELSE 0 END) as invested,
        SUM(CASE WHEN side = 'buy' THEN -amount * price ELSE amount * price END) * 100.0 /
          NULLIF(SUM(CASE WHEN side = 'buy' THEN amount * price ELSE 0 END), 0) as return_pct
      FROM orders
      WHERE user_id = $1 AND status = 'filled'
      GROUP BY pair
      ORDER BY return_pct DESC
      LIMIT 1
    `;

    const result = await qb.query(sql, [userId]);
    return result[0] || null;
  }
}

module.exports = TradingIntelligence;

