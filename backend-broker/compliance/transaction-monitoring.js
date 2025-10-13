/**
 * Transaction Monitoring System
 * Real-time monitoring for compliance
 */

const logger = require('../utils/logger');
const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);

class TransactionMonitoring {
  constructor() {
    this.rules = [
      {
        name: 'Large Single Transaction',
        threshold: 10000,
        action: 'review',
        check: (tx) => tx.amount > 10000
      },
      {
        name: 'Cumulative Daily Deposits',
        threshold: 15000,
        action: 'review',
        check: async (tx, userId) => {
          const total = await this.getDailyDepositTotal(userId);
          return total > 15000;
        }
      },
      {
        name: 'Rapid Transaction Velocity',
        threshold: 10,
        action: 'flag',
        check: async (tx, userId) => {
          const count = await this.getTransactionCountLast24h(userId);
          return count > 10;
        }
      },
      {
        name: 'Cross-Border High Risk',
        threshold: 5000,
        action: 'review',
        check: (tx) => tx.crossBorder && tx.amount > 5000
      }
    ];
  }

  /**
   * Monitor transaction in real-time
   */
  async monitorTransaction(userId, transactionData) {
    const alerts = [];

    for (const rule of this.rules) {
      try {
        const triggered = typeof rule.check === 'function'
          ? await rule.check(transactionData, userId)
          : false;

        if (triggered) {
          alerts.push({
            rule: rule.name,
            action: rule.action,
            threshold: rule.threshold
          });

          logger.warn('Transaction monitoring alert', {
            userId,
            rule: rule.name,
            transaction: transactionData
          });
        }
      } catch (error) {
        logger.error('Rule check failed', {
          rule: rule.name,
          error: error.message
        });
      }
    }

    // Record monitoring result
    await qb.insert('transaction_monitoring', {
      user_id: userId,
      transaction_data: JSON.stringify(transactionData),
      alerts: JSON.stringify(alerts),
      monitored_at: new Date(),
      requires_review: alerts.some(a => a.action === 'review')
    });

    return {
      passed: alerts.length === 0,
      alerts,
      requiresReview: alerts.some(a => a.action === 'review')
    };
  }

  /**
   * Get daily deposit total for user
   */
  async getDailyDepositTotal(userId) {
    const result = await qb.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM deposits
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '24 hours'
         AND status = 'completed'`,
      [userId]
    );

    return parseFloat(result[0]?.total || 0);
  }

  /**
   * Get transaction count in last 24h
   */
  async getTransactionCountLast24h(userId) {
    const result = await qb.query(
      `SELECT COUNT(*) as count
       FROM (
         SELECT created_at FROM deposits WHERE user_id = $1
         UNION ALL
         SELECT created_at FROM withdrawals WHERE user_id = $1
         UNION ALL
         SELECT created_at FROM orders WHERE user_id = $1
       ) AS all_transactions
       WHERE created_at >= NOW() - INTERVAL '24 hours'`,
      [userId]
    );

    return parseInt(result[0]?.count || 0);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate, endDate) {
    const sql = `
      SELECT 
        DATE(monitored_at) as date,
        COUNT(*) as total_monitored,
        COUNT(CASE WHEN requires_review THEN 1 END) as flagged_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM transaction_monitoring
      WHERE monitored_at BETWEEN $1 AND $2
      GROUP BY DATE(monitored_at)
      ORDER BY date DESC
    `;

    return await qb.query(sql, [startDate, endDate]);
  }

  /**
   * Get transactions requiring review
   */
  async getTransactionsForReview(limit = 50) {
    const sql = `
      SELECT tm.*, u.email
      FROM transaction_monitoring tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.requires_review = true
        AND tm.reviewed_at IS NULL
      ORDER BY tm.monitored_at DESC
      LIMIT $1
    `;

    return await qb.query(sql, [limit]);
  }
}

module.exports = new TransactionMonitoring();

