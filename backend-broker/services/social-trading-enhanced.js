/**
 * Enhanced Social Trading
 * Advanced social features
 */

const pool = require('../config/database');

class SocialTradingEnhanced {
  async createTradingRoom(userId, name, isPrivate) {
    const result = await pool.query(
      `INSERT INTO trading_rooms (creator_id, name, is_private, member_count, created_at)
       VALUES ($1, $2, $3, 1, NOW()) RETURNING *`,
      [userId, name, isPrivate]
    );

    return { success: true, room: result.rows[0] };
  }

  async shareTradeIdea(userId, idea) {
    const result = await pool.query(
      `INSERT INTO trade_ideas (user_id, asset, direction, target_price, reasoning, likes, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, NOW()) RETURNING *`,
      [userId, idea.asset, idea.direction, idea.targetPrice, idea.reasoning]
    );

    return { success: true, idea: result.rows[0] };
  }

  async getTradingRooms(userId) {
    const result = await pool.query(
      `SELECT * FROM trading_rooms WHERE is_private = false OR creator_id = $1`,
      [userId]
    );

    return { success: true, rooms: result.rows };
  }
}

module.exports = new SocialTradingEnhanced();

