/**
 * Achievement & Gamification System
 * Reward users for milestones and engagement
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');

const ACHIEVEMENTS = {
  FIRST_TRADE: {
    id: 'first_trade',
    name: 'First Trade',
    description: 'Complete your first trade',
    points: 100,
    badge: '🎯'
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Join in the first 1000 users',
    points: 500,
    badge: '🦅'
  },
  WHALE: {
    id: 'whale',
    name: 'Whale',
    description: 'Portfolio value exceeds £50,000',
    points: 1000,
    badge: '🐋'
  },
  DAY_TRADER: {
    id: 'day_trader',
    name: 'Day Trader',
    description: 'Complete 100 trades',
    points: 500,
    badge: '⚡'
  },
  HODLER: {
    id: 'hodler',
    name: 'HODLer',
    description: 'Hold position for 30+ days',
    points: 300,
    badge: '💎'
  },
  PROFITABLE: {
    id: 'profitable',
    name: 'Profitable Trader',
    description: 'Achieve 10% portfolio return',
    points: 800,
    badge: '📈'
  },
  REFERRAL_MASTER: {
    id: 'referral_master',
    name: 'Referral Master',
    description: 'Refer 10 users',
    points: 1000,
    badge: '🎁'
  },
  KYC_VERIFIED: {
    id: 'kyc_verified',
    name: 'Verified',
    description: 'Complete KYC verification',
    points: 200,
    badge: '✅'
  },
  STREAK_7: {
    id: 'streak_7',
    name: '7 Day Streak',
    description: 'Trade 7 days in a row',
    points: 300,
    badge: '🔥'
  },
  BIG_WIN: {
    id: 'big_win',
    name: 'Big Win',
    description: 'Single trade profit > £1,000',
    points: 500,
    badge: '💰'
  }
};

class AchievementSystem {
  /**
   * Award achievement to user
   */
  static async awardAchievement(userId, achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Check if already awarded
    const existing = await qb.select('user_achievements', {
      user_id: userId,
      achievement_id: achievementId
    });

    if (existing.length > 0) {
      return existing[0]; // Already has it
    }

    // Award achievement
    const award = await qb.insert('user_achievements', {
      user_id: userId,
      achievement_id: achievementId,
      name: achievement.name,
      description: achievement.description,
      points: achievement.points,
      badge: achievement.badge,
      awarded_at: new Date()
    });

    // Update user's total points
    await qb.query(
      'UPDATE users SET achievement_points = achievement_points + $1 WHERE id = $2',
      [achievement.points, userId]
    );

    logger.info('Achievement awarded', {
      userId,
      achievementId,
      points: achievement.points
    });

    return award;
  }

  /**
   * Check and award achievements based on user activity
   */
  static async checkAchievements(userId, event) {
    const achievements = [];

    switch (event.type) {
      case 'trade_completed':
        // First trade
        const tradeCount = await this.getTradeCount(userId);
        if (tradeCount === 1) {
          achievements.push(await this.awardAchievement(userId, 'FIRST_TRADE'));
        }
        if (tradeCount === 100) {
          achievements.push(await this.awardAchievement(userId, 'DAY_TRADER'));
        }
        break;

      case 'kyc_approved':
        achievements.push(await this.awardAchievement(userId, 'KYC_VERIFIED'));
        break;

      case 'referral_completed':
        const referralCount = await this.getReferralCount(userId);
        if (referralCount === 10) {
          achievements.push(await this.awardAchievement(userId, 'REFERRAL_MASTER'));
        }
        break;

      case 'portfolio_milestone':
        if (event.portfolioValue > 50000) {
          achievements.push(await this.awardAchievement(userId, 'WHALE'));
        }
        break;
    }

    return achievements;
  }

  /**
   * Get user's achievements
   */
  static async getUserAchievements(userId) {
    return await qb.select('user_achievements', { user_id: userId });
  }

  /**
   * Get achievement leaderboard
   */
  static async getLeaderboard(limit = 100) {
    const sql = `
      SELECT u.id, u.email, u.achievement_points,
        COUNT(ua.id) as total_achievements
      FROM users u
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      GROUP BY u.id, u.email, u.achievement_points
      ORDER BY u.achievement_points DESC
      LIMIT $1
    `;

    return await qb.query(sql, [limit]);
  }

  /**
   * Helper methods
   */
  static async getTradeCount(userId) {
    const result = await qb.query(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND status = \'filled\'',
      [userId]
    );
    return parseInt(result[0]?.count || 0);
  }

  static async getReferralCount(userId) {
    const result = await qb.query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
      [userId]
    );
    return parseInt(result[0]?.count || 0);
  }
}

module.exports = AchievementSystem;

