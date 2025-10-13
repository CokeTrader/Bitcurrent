/**
 * Crypto Lending Service
 * 
 * NEW REVENUE STREAM!
 * Users can lend their crypto and earn interest
 * Or borrow crypto against collateral
 * 
 * Revenue: Spread between lending and borrowing rates
 */

const pool = require('../config/database');

class CryptoLendingService {
  constructor() {
    // Lending rates (what users earn)
    this.lendingRates = {
      BTC: 8.0,  // 8% APY
      ETH: 10.0, // 10% APY
      SOL: 12.0,
      ADA: 9.0,
      DOT: 11.0
    };

    // Borrowing rates (what users pay)
    this.borrowingRates = {
      BTC: 12.0,  // 12% APY (4% spread = profit)
      ETH: 14.0,
      SOL: 16.0,
      ADA: 13.0,
      DOT: 15.0
    };

    // Loan-to-Value ratios
    this.ltvRatios = {
      BTC: 0.70, // Can borrow up to 70% of collateral value
      ETH: 0.65,
      SOL: 0.60,
      ADA: 0.55,
      DOT: 0.60
    };
  }

  /**
   * Create lending position (lend crypto, earn interest)
   */
  async lendCrypto(userId, asset, amount, duration = 30) {
    try {
      // Validation omitted for brevity
      
      const apr = this.lendingRates[asset];
      const maturityDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

      const result = await pool.query(
        `INSERT INTO lending_positions (
          user_id, asset, amount, duration_days, apr, status, started_at, matures_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'active', NOW(), $6, NOW())
        RETURNING *`,
        [userId, asset, amount, duration, apr, maturityDate]
      );

      // Deduct from balance
      await pool.query(
        `UPDATE users SET ${asset.toLowerCase()}_balance = ${asset.toLowerCase()}_balance - $1 WHERE id = $2`,
        [amount, userId]
      );

      const projectedInterest = (amount * apr / 100 * duration / 365).toFixed(8);

      return {
        success: true,
        position: result.rows[0],
        message: `Lent ${amount} ${asset} at ${apr}% APY for ${duration} days`,
        projectedInterest
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create borrowing position (borrow crypto against collateral)
   */
  async borrowCrypto(userId, collateralAsset, collateralAmount, borrowAsset, borrowAmount) {
    try {
      // Calculate collateral value and check LTV
      // Implementation details...

      return {
        success: true,
        message: `Borrowed ${borrowAmount} ${borrowAsset} against ${collateralAmount} ${collateralAsset} collateral`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate max borrowing amount
   */
  calculateMaxBorrow(collateralAsset, collateralAmount, collateralPrice) {
    const ltv = this.ltvRatios[collateralAsset] || 0.50;
    const collateralValue = collateralAmount * collateralPrice;
    const maxBorrow = collateralValue * ltv;

    return {
      success: true,
      maxBorrow,
      ltv: `${(ltv * 100).toFixed(0)}%`,
      collateralValue
    };
  }
}

module.exports = new CryptoLendingService();

