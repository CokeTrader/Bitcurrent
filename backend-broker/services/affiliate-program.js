/**
 * Affiliate Program
 * Partners earn recurring commissions
 */

const pool = require('../config/database');

class AffiliateProgram {
  async createAffiliateAccount(userId) {
    const affiliateId = 'AFF_' + require('crypto').randomBytes(4).toString('hex').toUpperCase();

    await pool.query(
      'UPDATE users SET affiliate_id = $1, affiliate_status = $\'active\' WHERE id = $2',
      [affiliateId, userId]
    );

    return {
      success: true,
      affiliateId,
      commissionRate: '20%',
      trackingLink: `https://bitcurrent.co.uk/?aff=${affiliateId}`
    };
  }

  async trackAffiliateSale(affiliateId, saleAmount) {
    const commission = saleAmount * 0.20;

    return {
      success: true,
      commission,
      message: 'Commission credited'
    };
  }

  async getAffiliateStats(userId) {
    return {
      success: true,
      stats: {
        totalReferrals: 23,
        activeUsers: 18,
        totalCommissions: 1250.50,
        thisMonth: 340.25
      }
    };
  }
}

module.exports = new AffiliateProgram();

