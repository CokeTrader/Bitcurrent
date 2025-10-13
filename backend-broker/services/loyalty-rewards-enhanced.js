/**
 * Enhanced Loyalty & Rewards
 * Comprehensive rewards system
 */

const pool = require('../config/database');

class LoyaltyRewardsEnhanced {
  async awardDailyBonus(userId) {
    const bonus = 1.00; // £1 daily bonus
    
    await pool.query(
      `INSERT INTO rewards (user_id, type, amount, description, created_at)
       VALUES ($1, 'daily_bonus', $2, 'Daily login bonus', NOW())`,
      [userId, bonus]
    );

    await pool.query(
      'UPDATE users SET gbp_balance = gbp_balance + $1 WHERE id = $2',
      [bonus, userId]
    );

    return { success: true, bonus };
  }

  async awardMilestoneReward(userId, milestone) {
    const rewards = {
      first_trade: 5,
      trade_100: 25,
      trade_1000: 100,
      referral_10: 50
    };

    const amount = rewards[milestone] || 0;

    if (amount > 0) {
      await pool.query(
        `INSERT INTO rewards (user_id, type, amount, description, created_at)
         VALUES ($1, 'milestone', $2, $3, NOW())`,
        [userId, amount, `Milestone: ${milestone}`]
      );

      await pool.query(
        'UPDATE users SET gbp_balance = gbp_balance + $1 WHERE id = $2',
        [amount, userId]
      );
    }

    return { success: true, reward: amount };
  }

  async getCashbackRate(userId) {
    const tier = await this.getUserTier(userId);
    const rates = {
      bronze: 0.001,
      silver: 0.002,
      gold: 0.005,
      platinum: 0.010
    };

    return rates[tier] || 0.001;
  }

  async getUserTier(userId) {
    const result = await pool.query(
      'SELECT tier FROM loyalty_points WHERE user_id = $1',
      [userId]
    );

    return result.rows[0]?.tier || 'bronze';
  }
}

module.exports = new LoyaltyRewardsEnhanced();

