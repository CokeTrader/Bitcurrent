/**
 * Referral & Rewards Service
 * 
 * Viral growth features:
 * - Referral program
 * - Unique referral codes
 * - Commission tracking
 * - Reward tiers
 * - Leaderboards
 */

const pool = require('../config/database');
const crypto = require('crypto');

class ReferralService {
  
  /**
   * Generate unique referral code
   */
  generateReferralCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Create referral code for user
   */
  async createReferralCode(userId) {
    try {
      // Check if user already has code
      const existing = await pool.query(
        'SELECT referral_code FROM users WHERE id = $1',
        [userId]
      );

      if (existing.rows[0]?.referral_code) {
        return {
          success: true,
          code: existing.rows[0].referral_code,
          message: 'Existing code'
        };
      }

      // Generate unique code
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        code = this.generateReferralCode();
        const check = await pool.query(
          'SELECT id FROM users WHERE referral_code = $1',
          [code]
        );
        isUnique = check.rows.length === 0;
      }

      // Update user
      await pool.query(
        'UPDATE users SET referral_code = $1 WHERE id = $2',
        [code, userId]
      );

      return {
        success: true,
        code,
        referralLink: `https://bitcurrent.co.uk/signup?ref=${code}`
      };

    } catch (error) {
      console.error('Create referral code error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track referral signup
   */
  async trackReferral(newUserId, referralCode) {
    try {
      // Find referrer
      const referrer = await pool.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referralCode]
      );

      if (referrer.rows.length === 0) {
        return { success: false, error: 'Invalid referral code' };
      }

      const referrerId = referrer.rows[0].id;

      // Record referral
      await pool.query(
        `INSERT INTO referrals (referrer_id, referred_id, status, created_at)
         VALUES ($1, $2, 'pending', NOW())`,
        [referrerId, newUserId]
      );

      // Update user's referred_by
      await pool.query(
        'UPDATE users SET referred_by = $1 WHERE id = $2',
        [referrerId, newUserId]
      );

      return {
        success: true,
        message: 'Referral tracked'
      };

    } catch (error) {
      console.error('Track referral error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Complete referral (when referred user makes first trade)
   */
  async completeReferral(userId) {
    try {
      // Find pending referral
      const result = await pool.query(
        `UPDATE referrals 
         SET status = 'completed', completed_at = NOW()
         WHERE referred_id = $1 AND status = 'pending'
         RETURNING referrer_id, id`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'No pending referral' };
      }

      const { referrer_id, id } = result.rows[0];

      // Award bonus to referrer (£10 bonus)
      const bonus = 10.00;
      
      await pool.query(
        'UPDATE users SET gbp_balance = gbp_balance + $1 WHERE id = $2',
        [bonus, referrer_id]
      );

      // Award bonus to referred user (£5 bonus)
      const referredBonus = 5.00;
      
      await pool.query(
        'UPDATE users SET gbp_balance = gbp_balance + $1 WHERE id = $2',
        [referredBonus, userId]
      );

      // Record rewards
      await pool.query(
        `INSERT INTO rewards (user_id, type, amount, description, created_at)
         VALUES 
         ($1, 'referral_bonus', $2, 'Referral bonus', NOW()),
         ($3, 'signup_bonus', $4, 'Sign-up bonus via referral', NOW())`,
        [referrer_id, bonus, userId, referredBonus]
      );

      return {
        success: true,
        referrerBonus: bonus,
        referredBonus: referredBonus
      };

    } catch (error) {
      console.error('Complete referral error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's referral stats
   */
  async getReferralStats(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_referrals,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_referrals,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_referrals,
          SUM(CASE WHEN status = 'completed' THEN 10.00 ELSE 0 END) as total_earned
         FROM referrals
         WHERE referrer_id = $1`,
        [userId]
      );

      const stats = result.rows[0];

      // Get recent referrals
      const recent = await pool.query(
        `SELECT 
          r.id,
          r.status,
          r.created_at,
          r.completed_at
         FROM referrals r
         WHERE r.referrer_id = $1
         ORDER BY r.created_at DESC
         LIMIT 10`,
        [userId]
      );

      return {
        success: true,
        stats: {
          totalReferrals: parseInt(stats.total_referrals || 0),
          completedReferrals: parseInt(stats.completed_referrals || 0),
          pendingReferrals: parseInt(stats.pending_referrals || 0),
          totalEarned: parseFloat(stats.total_earned || 0)
        },
        recentReferrals: recent.rows
      };

    } catch (error) {
      console.error('Get referral stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get referral leaderboard
   */
  async getReferralLeaderboard(limit = 100) {
    try {
      const result = await pool.query(
        `SELECT 
          u.id,
          u.username,
          u.referral_code,
          COUNT(r.id) FILTER (WHERE r.status = 'completed') as total_referrals,
          SUM(CASE WHEN r.status = 'completed' THEN 10.00 ELSE 0 END) as total_earned
         FROM users u
         LEFT JOIN referrals r ON u.id = r.referrer_id
         GROUP BY u.id, u.username, u.referral_code
         HAVING COUNT(r.id) FILTER (WHERE r.status = 'completed') > 0
         ORDER BY total_referrals DESC
         LIMIT $1`,
        [limit]
      );

      return {
        success: true,
        leaderboard: result.rows.map((row, index) => ({
          rank: index + 1,
          username: row.username || `User${row.id}`,
          totalReferrals: parseInt(row.total_referrals || 0),
          totalEarned: parseFloat(row.total_earned || 0)
        }))
      };

    } catch (error) {
      console.error('Get referral leaderboard error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ReferralService();

