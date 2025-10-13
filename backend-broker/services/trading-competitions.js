/**
 * Trading Competitions
 * Gamification for user engagement
 */

const pool = require('../config/database');

class TradingCompetitions {
  async createCompetition(details) {
    const { name, startDate, endDate, prizePool, rules } = details;

    const result = await pool.query(
      `INSERT INTO competitions (name, start_date, end_date, prize_pool, rules, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'upcoming', NOW()) RETURNING *`,
      [name, startDate, endDate, prizePool, JSON.stringify(rules)]
    );

    return { success: true, competition: result.rows[0] };
  }

  async joinCompetition(userId, competitionId) {
    await pool.query(
      `INSERT INTO competition_participants (user_id, competition_id, score, rank, created_at)
       VALUES ($1, $2, 0, 0, NOW())`,
      [userId, competitionId]
    );

    return { success: true, message: 'Joined competition' };
  }

  async getLeaderboard(competitionId) {
    const result = await pool.query(
      `SELECT u.username, cp.score, cp.rank 
       FROM competition_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.competition_id = $1
       ORDER BY cp.score DESC LIMIT 100`,
      [competitionId]
    );

    return { success: true, leaderboard: result.rows };
  }
}

module.exports = new TradingCompetitions();

