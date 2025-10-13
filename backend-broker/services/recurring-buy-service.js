/**
 * Recurring Buy Service
 * Automated DCA with fiat
 */

const pool = require('../config/database');

class RecurringBuyService {
  async createRecurringOrder(userId, config) {
    const { asset, amount, frequency, startDate } = config;

    const result = await pool.query(
      `INSERT INTO recurring_orders (
        user_id, asset, amount, frequency, next_execution, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'active', NOW()) RETURNING *`,
      [userId, asset, amount, frequency, startDate]
    );

    return {
      success: true,
      order: result.rows[0],
      message: `Recurring ${frequency} purchase of £${amount} ${asset} created`
    };
  }

  async executeRecurringOrders() {
    const orders = await pool.query(
      `SELECT * FROM recurring_orders 
       WHERE status = 'active' AND next_execution <= NOW()`
    );

    for (const order of orders.rows) {
      // Execute buy order
      console.log(`Executing recurring order #${order.id}`);
      
      // Update next execution
      const nextExec = this.calculateNextExecution(order.frequency);
      await pool.query(
        'UPDATE recurring_orders SET next_execution = $1 WHERE id = $2',
        [nextExec, order.id]
      );
    }

    return { success: true, executed: orders.rows.length };
  }

  calculateNextExecution(frequency) {
    const now = new Date();
    const intervals = {
      daily: 1,
      weekly: 7,
      monthly: 30
    };

    const days = intervals[frequency] || 7;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }
}

module.exports = new RecurringBuyService();

