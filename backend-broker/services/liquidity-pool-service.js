/**
 * Liquidity Pool Service
 * Users provide liquidity, earn fees from trades
 */

const pool = require('../config/database');

class LiquidityPoolService {
  async addLiquidity(userId, asset1, amount1, asset2, amount2) {
    try {
      const result = await pool.query(
        `INSERT INTO liquidity_pools (user_id, asset1, amount1, asset2, amount2, share, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 0, 'active', NOW()) RETURNING *`,
        [userId, asset1, amount1, asset2, amount2]
      );

      await pool.query(
        `UPDATE users SET 
         ${asset1.toLowerCase()}_balance = ${asset1.toLowerCase()}_balance - $1,
         ${asset2.toLowerCase()}_balance = ${asset2.toLowerCase()}_balance - $2
         WHERE id = $3`,
        [amount1, amount2, userId]
      );

      return { success: true, pool: result.rows[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async removeLiquidity(userId, poolId) {
    try {
      const result = await pool.query(
        `UPDATE liquidity_pools SET status = 'withdrawn', withdrawn_at = NOW() 
         WHERE id = $1 AND user_id = $2 RETURNING *`,
        [poolId, userId]
      );

      if (result.rows.length > 0) {
        const lp = result.rows[0];
        await pool.query(
          `UPDATE users SET 
           ${lp.asset1.toLowerCase()}_balance = ${lp.asset1.toLowerCase()}_balance + $1,
           ${lp.asset2.toLowerCase()}_balance = ${lp.asset2.toLowerCase()}_balance + $2
           WHERE id = $3`,
          [lp.amount1, lp.amount2, userId]
        );
      }

      return { success: true, message: 'Liquidity removed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new LiquidityPoolService();

