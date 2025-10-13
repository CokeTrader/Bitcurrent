/**
 * Options Trading Service
 * Call and Put options on crypto
 */

const pool = require('../config/database');

class OptionsTrading {
  async buyCallOption(userId, asset, strikePrice, expiryDays, contracts) {
    const premium = this.calculatePremium(asset, strikePrice, expiryDays, 'call');
    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO options_contracts (
        user_id, asset, strike_price, expiry_date, option_type, premium, status, created_at
      ) VALUES ($1, $2, $3, $4, 'call', $5, 'active', NOW()) RETURNING *`,
      [userId, asset, strikePrice, expiryDate, premium]
    );

    return { success: true, option: result.rows[0], premium };
  }

  async buyPutOption(userId, asset, strikePrice, expiryDays, contracts) {
    const premium = this.calculatePremium(asset, strikePrice, expiryDays, 'put');
    const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO options_contracts (
        user_id, asset, strike_price, expiry_date, option_type, premium, status, created_at
      ) VALUES ($1, $2, $3, $4, 'put', $5, 'active', NOW()) RETURNING *`,
      [userId, asset, strikePrice, expiryDate, premium]
    );

    return { success: true, option: result.rows[0], premium };
  }

  calculatePremium(asset, strikePrice, expiryDays, optionType) {
    // Black-Scholes simplified
    const baseRate = 0.02;
    const volatility = 0.7;
    const timeValue = Math.sqrt(expiryDays / 365) * volatility;
    
    return strikePrice * (baseRate + timeValue);
  }

  async exerciseOption(userId, optionId, currentPrice) {
    const option = await pool.query(
      'SELECT * FROM options_contracts WHERE id = $1 AND user_id = $2',
      [optionId, userId]
    );

    if (option.rows.length === 0) {
      return { success: false, error: 'Option not found' };
    }

    const opt = option.rows[0];
    let profit = 0;

    if (opt.option_type === 'call' && currentPrice > opt.strike_price) {
      profit = currentPrice - opt.strike_price - opt.premium;
    } else if (opt.option_type === 'put' && currentPrice < opt.strike_price) {
      profit = opt.strike_price - currentPrice - opt.premium;
    }

    await pool.query(
      `UPDATE options_contracts SET status = 'exercised', exercised_at = NOW() WHERE id = $1`,
      [optionId]
    );

    return { success: true, profit, message: 'Option exercised' };
  }
}

module.exports = new OptionsTrading();

