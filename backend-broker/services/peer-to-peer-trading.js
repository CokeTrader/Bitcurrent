/**
 * P2P Trading Service
 * Direct user-to-user trading
 */

const pool = require('../config/database');

class P2PTrading {
  async createP2POffer(userId, offerDetails) {
    const { asset, amount, price, fiatCurrency, paymentMethods } = offerDetails;

    const result = await pool.query(
      `INSERT INTO p2p_offers (
        user_id, asset, amount, price, fiat_currency, payment_methods, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW()) RETURNING *`,
      [userId, asset, amount, price, fiatCurrency, JSON.stringify(paymentMethods)]
    );

    return { success: true, offer: result.rows[0] };
  }

  async acceptP2POffer(buyerId, offerId) {
    const result = await pool.query(
      `UPDATE p2p_offers SET buyer_id = $1, status = 'in_progress' WHERE id = $2 RETURNING *`,
      [buyerId, offerId]
    );

    return {
      success: true,
      trade: result.rows[0],
      message: 'Escrow initiated - complete payment to seller'
    };
  }

  async releaseEscrow(offerId) {
    await pool.query(
      'UPDATE p2p_offers SET status = $\'completed\', completed_at = NOW() WHERE id = $1',
      [offerId]
    );

    return { success: true, message: 'Assets released from escrow' };
  }
}

module.exports = new P2PTrading();

