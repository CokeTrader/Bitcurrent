/**
 * API Marketplace
 * Developers can buy API access packages
 */

const pool = require('../config/database');

class APIMarketplace {
  constructor() {
    this.packages = {
      starter: { price: 9.99, requests: 10000, rateLimit: 10 },
      pro: { price: 49.99, requests: 100000, rateLimit: 50 },
      enterprise: { price: 199.99, requests: 1000000, rateLimit: 200 }
    };
  }

  async subscribeToPlan(userId, planName) {
    const plan = this.packages[planName];
    if (!plan) {
      return { success: false, error: 'Invalid plan' };
    }

    const result = await pool.query(
      `INSERT INTO api_subscriptions (user_id, plan, monthly_price, requests_limit, rate_limit, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW()) RETURNING *`,
      [userId, planName, plan.price, plan.requests, plan.rateLimit]
    );

    return {
      success: true,
      subscription: result.rows[0],
      message: `Subscribed to ${planName} plan`
    };
  }

  async generateAPIKey(userId, name, permissions) {
    const key = 'bk_' + require('crypto').randomBytes(32).toString('hex');
    const secret = 'bs_' + require('crypto').randomBytes(32).toString('hex');

    const result = await pool.query(
      `INSERT INTO api_keys (user_id, key_hash, secret_hash, name, permissions, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
      [userId, key, secret, name, JSON.stringify(permissions)]
    );

    return {
      success: true,
      apiKey: key,
      apiSecret: secret,
      id: result.rows[0].id,
      warning: 'Store secret securely - it will not be shown again'
    };
  }
}

module.exports = new APIMarketplace();

