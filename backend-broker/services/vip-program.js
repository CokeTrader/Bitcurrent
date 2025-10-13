/**
 * VIP Program
 * Premium benefits for high-value users
 */

const pool = require('../config/database');

class VIPProgram {
  constructor() {
    this.tiers = {
      standard: { minVolume: 0, benefits: [] },
      vip1: { minVolume: 100000, benefits: ['0.4% fee', 'Priority support'] },
      vip2: { minVolume: 500000, benefits: ['0.3% fee', 'Dedicated manager', 'Early features'] },
      vip3: { minVolume: 1000000, benefits: ['0.2% fee', 'OTC desk', 'Custom solutions'] }
    };
  }

  async checkVIPStatus(userId) {
    const volume = await this.getUserTradingVolume(userId);
    
    let tier = 'standard';
    if (volume >= 1000000) tier = 'vip3';
    else if (volume >= 500000) tier = 'vip2';
    else if (volume >= 100000) tier = 'vip1';

    return {
      success: true,
      tier,
      volume,
      benefits: this.tiers[tier].benefits
    };
  }

  async getUserTradingVolume(userId) {
    const result = await pool.query(
      'SELECT SUM(total) as volume FROM trades WHERE user_id = $1',
      [userId]
    );

    return parseFloat(result.rows[0]?.volume || 0);
  }
}

module.exports = new VIPProgram();

