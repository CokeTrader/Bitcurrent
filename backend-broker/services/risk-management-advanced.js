/**
 * Advanced Risk Management
 * Protect users and platform
 */

const pool = require('../config/database');

class RiskManagement {
  constructor() {
    this.limits = {
      daily_withdrawal: 10000,
      daily_trading_volume: 50000,
      max_position_size: 100000,
      max_leverage: 10
    };
  }

  async checkRiskLimits(userId, operation, amount) {
    const checks = [];

    if (operation === 'withdrawal') {
      const todayWithdrawals = await this.getTodayWithdrawals(userId);
      if (todayWithdrawals + amount > this.limits.daily_withdrawal) {
        checks.push({ passed: false, reason: 'Daily withdrawal limit exceeded' });
      } else {
        checks.push({ passed: true });
      }
    }

    const allPassed = checks.every(c => c.passed);

    return {
      success: allPassed,
      checks,
      allowed: allPassed
    };
  }

  async getTodayWithdrawals(userId) {
    const result = await pool.query(
      `SELECT SUM(amount) as total FROM withdrawals 
       WHERE user_id = $1 AND created_at >= CURRENT_DATE`,
      [userId]
    );

    return parseFloat(result.rows[0]?.total || 0);
  }

  async calculatePortfolioRisk(userId) {
    return {
      success: true,
      riskScore: 45, // 0-100
      riskLevel: 'Medium',
      recommendations: [
        'Diversify across more assets',
        'Consider stop-loss orders',
        'Reduce leverage exposure'
      ]
    };
  }

  async setRiskLimits(userId, limits) {
    await pool.query(
      `INSERT INTO user_risk_limits (user_id, limits, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET limits = $2`,
      [userId, JSON.stringify(limits)]
    );

    return { success: true, message: 'Risk limits updated' };
  }
}

module.exports = new RiskManagement();

