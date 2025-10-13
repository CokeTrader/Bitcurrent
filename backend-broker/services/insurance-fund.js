/**
 * Insurance Fund
 * Protect users from platform failures
 */

const pool = require('../config/database');

class InsuranceFund {
  constructor() {
    this.fundBalance = 0;
    this.coverageLimit = 50000; // £50k per user
  }

  async contributeTo Fund(amount) {
    this.fundBalance += amount;
    
    await pool.query(
      `INSERT INTO insurance_fund_transactions (type, amount, balance, created_at)
       VALUES ('contribution', $1, $2, NOW())`,
      [amount, this.fundBalance]
    );

    return { success: true, newBalance: this.fundBalance };
  }

  async checkCoverage(userId, asset, amount) {
    const userValue = amount * 40000; // Simplified

    return {
      success: true,
      covered: userValue <= this.coverageLimit,
      coverageAmount: Math.min(userValue, this.coverageLimit),
      fundBalance: this.fundBalance
    };
  }

  async processClaim(userId, claimAmount, reason) {
    if (claimAmount > this.coverageLimit) {
      return { success: false, error: 'Exceeds coverage limit' };
    }

    if (claimAmount > this.fundBalance) {
      return { success: false, error: 'Insufficient fund balance' };
    }

    this.fundBalance -= claimAmount;

    await pool.query(
      `INSERT INTO insurance_claims (user_id, amount, reason, status, created_at)
       VALUES ($1, $2, $3, 'approved', NOW())`,
      [userId, claimAmount, reason]
    );

    return { success: true, paidOut: claimAmount };
  }
}

module.exports = new InsuranceFund();

