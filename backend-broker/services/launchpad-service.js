/**
 * Token Launchpad
 * Initial DEX Offerings (IDO)
 */

const pool = require('../config/database');

class LaunchpadService {
  async createTokenSale(projectDetails) {
    const { tokenName, totalSupply, price, startDate, endDate } = projectDetails;

    const result = await pool.query(
      `INSERT INTO token_sales (token_name, total_supply, price, start_date, end_date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'upcoming', NOW()) RETURNING *`,
      [tokenName, totalSupply, price, startDate, endDate]
    );

    return { success: true, sale: result.rows[0] };
  }

  async participateInSale(userId, saleId, amount) {
    return {
      success: true,
      allocation: amount / 0.10,
      message: `Committed £${amount} to token sale`
    };
  }
}

module.exports = new LaunchpadService();

