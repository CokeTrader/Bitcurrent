/**
 * Crypto Escrow Service
 * Secure intermediary for transactions
 */

const pool = require('../config/database');

class CryptoEscrow {
  async createEscrow(buyerId, sellerId, asset, amount, terms) {
    const result = await pool.query(
      `INSERT INTO escrows (buyer_id, seller_id, asset, amount, terms, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) RETURNING *`,
      [buyerId, sellerId, asset, amount, JSON.stringify(terms)]
    );

    return {
      success: true,
      escrow: result.rows[0],
      message: 'Escrow created - awaiting funding'
    };
  }

  async fundEscrow(escrowId, userId) {
    await pool.query(
      'UPDATE escrows SET status = $\'funded\', funded_at = NOW() WHERE id = $1',
      [escrowId]
    );

    return { success: true, message: 'Escrow funded' };
  }

  async releaseEscrow(escrowId, releaseBy) {
    await pool.query(
      'UPDATE escrows SET status = $\'released\', released_at = NOW(), released_by = $2 WHERE id = $1',
      [escrowId, releaseBy]
    );

    return { success: true, message: 'Funds released to seller' };
  }
}

module.exports = new CryptoEscrow();

