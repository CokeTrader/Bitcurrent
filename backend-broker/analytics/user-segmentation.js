/**
 * User Segmentation for Targeted Marketing
 * Data-driven user categorization
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');

class UserSegmentation {
  /**
   * Segment users by behavior
   */
  static async segmentUsers() {
    const segments = {
      whales: await this.getWhales(),
      activeTraders: await this.getActiveTraders(),
      hodlers: await this.getHodlers(),
      newUsers: await this.getNewUsers(),
      dormant: await this.getDormantUsers(),
      highValue: await this.getHighValueUsers()
    };

    return segments;
  }

  /**
   * Whales: Users with >£50k portfolio
   */
  static async getWhales() {
    const sql = `
      SELECT u.id, u.email, SUM(b.total * 67000) as portfolio_value
      FROM users u
      JOIN balances b ON b.user_id = u.id
      GROUP BY u.id, u.email
      HAVING SUM(b.total * 67000) > 50000
      ORDER BY portfolio_value DESC
    `;

    return await qb.query(sql);
  }

  /**
   * Active traders: >10 trades/week
   */
  static async getActiveTraders() {
    const sql = `
      SELECT u.id, u.email, COUNT(o.id) as weekly_trades
      FROM users u
      JOIN orders o ON o.user_id = u.id
      WHERE o.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY u.id, u.email
      HAVING COUNT(o.id) > 10
      ORDER BY weekly_trades DESC
    `;

    return await qb.query(sql);
  }

  /**
   * HODLers: No trades in 30 days but has balance
   */
  static async getHodlers() {
    const sql = `
      SELECT u.id, u.email, SUM(b.total * 67000) as portfolio_value
      FROM users u
      JOIN balances b ON b.user_id = u.id
      LEFT JOIN orders o ON o.user_id = u.id 
        AND o.created_at >= NOW() - INTERVAL '30 days'
      WHERE b.total > 0
      GROUP BY u.id, u.email
      HAVING COUNT(o.id) = 0
      ORDER BY portfolio_value DESC
    `;

    return await qb.query(sql);
  }

  /**
   * New users: Registered <14 days
   */
  static async getNewUsers() {
    return await qb.query(`
      SELECT id, email, created_at
      FROM users
      WHERE created_at >= NOW() - INTERVAL '14 days'
      ORDER BY created_at DESC
    `);
  }

  /**
   * Dormant: No activity in 90 days
   */
  static async getDormantUsers() {
    const sql = `
      SELECT u.id, u.email, MAX(o.created_at) as last_activity
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.created_at < NOW() - INTERVAL '90 days'
      GROUP BY u.id, u.email
      HAVING MAX(o.created_at) < NOW() - INTERVAL '90 days' 
        OR MAX(o.created_at) IS NULL
      ORDER BY last_activity DESC NULLS LAST
    `;

    return await qb.query(sql);
  }

  /**
   * High-value: Large deposits or high volume
   */
  static async getHighValueUsers() {
    const sql = `
      SELECT u.id, u.email, 
        SUM(d.amount) as total_deposits,
        SUM(o.amount * o.price) as total_volume
      FROM users u
      LEFT JOIN deposits d ON d.user_id = u.id AND d.status = 'completed'
      LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'filled'
      GROUP BY u.id, u.email
      HAVING SUM(d.amount) > 10000 OR SUM(o.amount * o.price) > 100000
      ORDER BY total_volume DESC
    `;

    return await qb.query(sql);
  }

  /**
   * Get segment statistics
   */
  static async getSegmentStats() {
    const segments = await this.segmentUsers();

    return {
      whales: {
        count: segments.whales.length,
        totalValue: segments.whales.reduce((sum, u) => sum + parseFloat(u.portfolio_value || 0), 0)
      },
      activeTraders: {
        count: segments.activeTraders.length,
        avgTrades: segments.activeTraders.reduce((sum, u) => sum + parseInt(u.weekly_trades), 0) / segments.activeTraders.length || 0
      },
      hodlers: {
        count: segments.hodlers.length,
        totalValue: segments.hodlers.reduce((sum, u) => sum + parseFloat(u.portfolio_value || 0), 0)
      },
      newUsers: {
        count: segments.newUsers.length
      },
      dormant: {
        count: segments.dormant.length
      },
      highValue: {
        count: segments.highValue.length,
        totalDeposits: segments.highValue.reduce((sum, u) => sum + parseFloat(u.total_deposits || 0), 0)
      }
    };
  }

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(userId) {
    const recommendations = [];

    // Based on trading pattern
    const patterns = await this.identifyPatterns(userId);
    
    if (patterns.primaryStrategy === 'dayTrading') {
      recommendations.push({
        title: 'Lower Your Fees',
        description: 'As a day trader, consider our volume discount program',
        action: 'Learn More',
        actionUrl: '/fees'
      });
    }

    if (patterns.primaryStrategy === 'hodling') {
      recommendations.push({
        title: 'Earn While You HODL',
        description: 'Stake your crypto and earn up to 8% APY',
        action: 'Start Staking',
        actionUrl: '/earn'
      });
    }

    // Based on portfolio
    const portfolioValue = 10000; // Fetch from balances
    if (portfolioValue > 50000) {
      recommendations.push({
        title: 'Institutional Account',
        description: 'Unlock lower fees and dedicated support',
        action: 'Upgrade',
        actionUrl: '/institutional'
      });
    }

    return recommendations;
  }
}

module.exports = TradingIntelligence;

