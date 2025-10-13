/**
 * Dispute Resolution Service
 * Mediate trading disputes
 */

const pool = require('../config/database');

class DisputeResolution {
  async openDispute(userId, transactionId, reason) {
    const result = await pool.query(
      `INSERT INTO disputes (user_id, transaction_id, reason, status, created_at)
       VALUES ($1, $2, $3, 'open', NOW()) RETURNING *`,
      [userId, transactionId, reason]
    );

    return {
      success: true,
      dispute: result.rows[0],
      message: 'Dispute opened - admin will review within 24 hours'
    };
  }

  async resolveDispute(disputeId, resolution, adminId) {
    await pool.query(
      `UPDATE disputes SET status = 'resolved', resolution = $1, resolved_by = $2, resolved_at = NOW() 
       WHERE id = $3`,
      [resolution, adminId, disputeId]
    );

    return { success: true, message: 'Dispute resolved' };
  }
}

module.exports = new DisputeResolution();

