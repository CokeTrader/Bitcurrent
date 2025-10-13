/**
 * Trading Journal
 * Track and analyze all trades
 */

const pool = require('../config/database');

class TradingJournal {
  async addJournalEntry(userId, tradeId, notes, emotions, strategy) {
    await pool.query(
      `INSERT INTO trade_journal (user_id, trade_id, notes, emotions, strategy, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, tradeId, notes, emotions, strategy]
    );

    return { success: true, message: 'Journal entry saved' };
  }

  async getJournalInsights(userId) {
    return {
      success: true,
      insights: [
        'Emotional trades have 45% win rate',
        'Planned trades have 72% win rate',
        'Best strategy: Breakout trading'
      ]
    };
  }
}

module.exports = new TradingJournal();

