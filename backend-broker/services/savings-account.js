/**
 * Crypto Savings Account
 * High-yield savings on stablecoins
 */

const pool = require('../config/database');

class SavingsAccount {
  constructor() {
    this.savingsRates = {
      USDT: 8.0,
      USDC: 8.5,
      DAI: 9.0,
      BUSD: 8.2
    };
  }

  async openSavingsAccount(userId, stablecoin, initialDeposit) {
    const apr = this.savingsRates[stablecoin] || 8.0;

    const result = await pool.query(
      `INSERT INTO savings_accounts (user_id, stablecoin, balance, apr, status, created_at)
       VALUES ($1, $2, $3, $4, 'active', NOW()) RETURNING *`,
      [userId, stablecoin, initialDeposit, apr]
    );

    return {
      success: true,
      account: result.rows[0],
      message: `Opened savings account earning ${apr}% APY`
    };
  }

  async depositToSavings(userId, accountId, amount) {
    await pool.query(
      'UPDATE savings_accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3',
      [amount, accountId, userId]
    );

    return { success: true, newBalance: amount };
  }

  async calculateDailyInterest() {
    const accounts = await pool.query(
      'SELECT * FROM savings_accounts WHERE status = $\'active\''
    );

    for (const account of accounts.rows) {
      const dailyRate = account.apr / 365 / 100;
      const interest = account.balance * dailyRate;

      await pool.query(
        'UPDATE savings_accounts SET balance = balance + $1, total_interest = total_interest + $1 WHERE id = $2',
        [interest, account.id]
      );
    }

    return { success: true, processed: accounts.rows.length };
  }
}

module.exports = new SavingsAccount();

