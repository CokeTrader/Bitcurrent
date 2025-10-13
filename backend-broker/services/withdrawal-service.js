/**
 * Withdrawal Service
 * Handle all withdrawal-related business logic
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');
const EmailService = require('../utils/email-service');

class WithdrawalService {
  /**
   * Request withdrawal
   */
  static async requestWithdrawal(userId, amount, currency, destination) {
    try {
      // Validate amount
      if (amount < 10) {
        throw new Error('Minimum withdrawal is £10');
      }

      // Check user balance
      const balances = await qb.select('balances', { user_id: userId, currency });
      
      if (balances.length === 0) {
        throw new Error('Insufficient balance');
      }

      const balance = balances[0];
      if (parseFloat(balance.available) < amount) {
        throw new Error(`Insufficient available balance. Available: ${balance.available} ${currency}`);
      }

      // Check KYC status
      const users = await qb.select('users', { id: userId });
      const user = users[0];
      
      if (!user.kyc_verified) {
        throw new Error('KYC verification required for withdrawals');
      }

      // Lock the funds
      await this.lockFunds(userId, amount, currency);

      // Create withdrawal request
      const withdrawal = await qb.insert('withdrawals', {
        user_id: userId,
        amount,
        currency,
        destination,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      });

      // Send email notification
      await EmailService.sendWithdrawalRequested(userId, amount, currency);

      logger.info('Withdrawal requested', {
        userId,
        withdrawalId: withdrawal.id,
        amount,
        currency
      });

      return withdrawal;
    } catch (error) {
      logger.error('Withdrawal request failed', {
        userId,
        amount,
        currency,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Approve withdrawal (admin action)
   */
  static async approveWithdrawal(withdrawalId, adminId) {
    try {
      const withdrawals = await qb.select('withdrawals', { id: withdrawalId });
      const withdrawal = withdrawals[0];

      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }

      if (withdrawal.status !== 'pending') {
        throw new Error('Withdrawal is not pending');
      }

      // Update status
      await qb.update('withdrawals',
        {
          status: 'approved',
          approved_by: adminId,
          approved_at: new Date(),
          updated_at: new Date()
        },
        { id: withdrawalId }
      );

      // Deduct locked funds
      await this.deductLockedFunds(
        withdrawal.user_id,
        withdrawal.amount,
        withdrawal.currency
      );

      // Send confirmation email
      await EmailService.sendWithdrawalApproved(
        withdrawal.user_id,
        withdrawal.amount,
        withdrawal.currency
      );

      logger.info('Withdrawal approved', {
        withdrawalId,
        userId: withdrawal.user_id,
        amount: withdrawal.amount,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('Withdrawal approval failed', {
        withdrawalId,
        adminId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Reject withdrawal
   */
  static async rejectWithdrawal(withdrawalId, adminId, reason) {
    try {
      const withdrawals = await qb.select('withdrawals', { id: withdrawalId });
      const withdrawal = withdrawals[0];

      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }

      // Update status
      await qb.update('withdrawals',
        {
          status: 'rejected',
          rejected_by: adminId,
          rejection_reason: reason,
          rejected_at: new Date(),
          updated_at: new Date()
        },
        { id: withdrawalId }
      );

      // Unlock the funds
      await this.unlockFunds(
        withdrawal.user_id,
        withdrawal.amount,
        withdrawal.currency
      );

      // Send rejection email
      await EmailService.sendWithdrawalRejected(
        withdrawal.user_id,
        withdrawal.amount,
        withdrawal.currency,
        reason
      );

      logger.info('Withdrawal rejected', {
        withdrawalId,
        userId: withdrawal.user_id,
        reason,
        adminId
      });

      return true;
    } catch (error) {
      logger.error('Withdrawal rejection failed', {
        withdrawalId,
        adminId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Lock funds for withdrawal
   */
  static async lockFunds(userId, amount, currency) {
    const balances = await qb.select('balances', { user_id: userId, currency });
    const balance = balances[0];

    const newAvailable = parseFloat(balance.available) - amount;
    const newLocked = parseFloat(balance.locked) + amount;

    await qb.update('balances',
      {
        available: newAvailable,
        locked: newLocked,
        updated_at: new Date()
      },
      { user_id: userId, currency }
    );

    logger.info('Funds locked', { userId, amount, currency });
  }

  /**
   * Unlock funds (e.g., after rejection)
   */
  static async unlockFunds(userId, amount, currency) {
    const balances = await qb.select('balances', { user_id: userId, currency });
    const balance = balances[0];

    const newAvailable = parseFloat(balance.available) + amount;
    const newLocked = parseFloat(balance.locked) - amount;

    await qb.update('balances',
      {
        available: newAvailable,
        locked: newLocked,
        updated_at: new Date()
      },
      { user_id: userId, currency }
    );

    logger.info('Funds unlocked', { userId, amount, currency });
  }

  /**
   * Deduct locked funds (after approval)
   */
  static async deductLockedFunds(userId, amount, currency) {
    const balances = await qb.select('balances', { user_id: userId, currency });
    const balance = balances[0];

    const newTotal = parseFloat(balance.total) - amount;
    const newLocked = parseFloat(balance.locked) - amount;

    await qb.update('balances',
      {
        total: newTotal,
        locked: newLocked,
        updated_at: new Date()
      },
      { user_id: userId, currency }
    );

    logger.info('Funds deducted', { userId, amount, currency });
  }

  /**
   * Get withdrawal history
   */
  static async getWithdrawalHistory(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;

    let conditions = { user_id: userId };
    if (status) conditions.status = status;

    const sql = `
      SELECT * FROM withdrawals
      WHERE user_id = $1
      ${status ? 'AND status = $2' : ''}
      ORDER BY created_at DESC
      LIMIT $${status ? 3 : 2}
      OFFSET $${status ? 4 : 3}
    `;

    const params = [userId];
    if (status) params.push(status);
    params.push(limit, offset);

    return await qb.query(sql, params);
  }

  /**
   * Get withdrawal by ID
   */
  static async getWithdrawalById(withdrawalId, userId) {
    const withdrawals = await qb.select('withdrawals', { id: withdrawalId, user_id: userId });
    return withdrawals[0] || null;
  }
}

module.exports = WithdrawalService;

