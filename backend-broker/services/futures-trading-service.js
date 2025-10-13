/**
 * Futures Trading Service
 * Trade crypto futures with leverage
 */

const pool = require('../config/database');

class FuturesTradingService {
  constructor() {
    this.contractSizes = { BTC: 1, ETH: 10, SOL: 100 };
    this.maxLeverage = 20;
  }

  async openFuturesPosition(userId, asset, contracts, leverage, side, entryPrice) {
    try {
      const positionSize = contracts * this.contractSizes[asset];
      const margin = (positionSize * entryPrice) / leverage;

      const result = await pool.query(
        `INSERT INTO futures_positions (
          user_id, asset, contracts, leverage, side, entry_price, margin, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', NOW()) RETURNING *`,
        [userId, asset, contracts, leverage, side, entryPrice, margin]
      );

      return { success: true, position: result.rows[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async closeFuturesPosition(userId, positionId, exitPrice) {
    try {
      const position = await pool.query(
        'SELECT * FROM futures_positions WHERE id = $1 AND user_id = $2',
        [positionId, userId]
      );

      if (position.rows.length === 0) {
        return { success: false, error: 'Position not found' };
      }

      const pos = position.rows[0];
      const pnl = this.calculateFuturesPnL(pos, exitPrice);

      await pool.query(
        `UPDATE futures_positions SET status = 'closed', exit_price = $1, pnl = $2, closed_at = NOW()
         WHERE id = $3`,
        [exitPrice, pnl, positionId]
      );

      return { success: true, pnl, message: 'Position closed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  calculateFuturesPnL(position, exitPrice) {
    const positionSize = position.contracts * this.contractSizes[position.asset];
    const priceChange = position.side === 'long' 
      ? (exitPrice - position.entry_price)
      : (position.entry_price - exitPrice);
    
    return positionSize * priceChange;
  }
}

module.exports = new FuturesTradingService();

