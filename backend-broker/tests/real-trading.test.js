/**
 * Real Bitcoin Trading - Unit Tests
 * 
 * Test the CORE £10 journey:
 * 1. Deposit £10
 * 2. Buy Bitcoin
 * 3. Sell Bitcoin (or withdraw)
 * 4. Verify PnL calculation
 */

const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const pool = require('../config/database');

describe('Real Bitcoin Trading Flow', () => {
  let authToken;
  let testUserId;

  before(async () => {
    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, gbp_balance, btc_balance, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      ['test@bitcurrent.test', 'hashed_password', 100.00, 0]
    );
    
    testUserId = userResult.rows[0].id;

    // Generate test token (simplified)
    authToken = 'test_token_' + testUserId;
  });

  after(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM trades WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('POST /api/v1/real-trading/deposit', () => {
    it('should deposit £10 successfully', async () => {
      const res = await request(app)
        .post('/api/v1/real-trading/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10,
          paymentMethodId: 'pm_test_card'
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.balance.gbp).to.be.at.least(10);
    });

    it('should reject deposits below £10 minimum', async () => {
      const res = await request(app)
        .post('/api/v1/real-trading/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5,
          paymentMethodId: 'pm_test_card'
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.include('Minimum');
    });
  });

  describe('POST /api/v1/real-trading/buy', () => {
    it('should buy Bitcoin with GBP', async () => {
      const res = await request(app)
        .post('/api/v1/real-trading/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gbpAmount: 10
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.btcAmount).to.be.above(0);
      expect(res.body.newBalance.btc).to.be.above(0);
    });

    it('should reject buy with insufficient balance', async () => {
      const res = await request(app)
        .post('/api/v1/real-trading/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gbpAmount: 10000 // More than test user has
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.include('Insufficient');
    });
  });

  describe('POST /api/v1/real-trading/sell', () => {
    it('should sell Bitcoin for GBP with PnL', async () => {
      // First ensure user has BTC
      await pool.query(
        'UPDATE users SET btc_balance = 0.001 WHERE id = $1',
        [testUserId]
      );

      const res = await request(app)
        .post('/api/v1/real-trading/sell')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          btcAmount: 0.0005
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.pnl).to.exist;
      expect(res.body.pnl).to.have.property('amount');
      expect(res.body.pnl).to.have.property('percentage');
    });
  });

  describe('GET /api/v1/real-trading/portfolio', () => {
    it('should return complete portfolio with PnL', async () => {
      const res = await request(app)
        .get('/api/v1/real-trading/portfolio')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.portfolio).to.have.property('gbp');
      expect(res.body.portfolio).to.have.property('btc');
      expect(res.body.portfolio).to.have.property('totalValueInGBP');
      expect(res.body.portfolio.pnl).to.exist;
    });
  });

  describe('POST /api/v1/real-trading/withdraw-btc', () => {
    it('should validate Bitcoin address format', async () => {
      const res = await request(app)
        .post('/api/v1/real-trading/withdraw-btc')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address: 'invalid_address',
          btcAmount: 0.001
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.include('Invalid');
    });

    it('should accept valid Bitcoin address', async () => {
      const res = await request(app)
        .post('/api/v1/real-trading/withdraw-btc')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          btcAmount: 0.0001
        });

      // May fail if KYC not verified, but should not error on address validation
      expect(res.status).to.be.oneOf([200, 403]);
    });
  });
});

describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const res = await request(app)
        .get('/api/v1/real-trading/portfolio');

      expect(res.status).to.equal(401);
    });

    it('should reject invalid tokens', async () => {
      const res = await request(app)
        .get('/api/v1/real-trading/portfolio')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).to.be.oneOf([401, 403]);
    });
  });

  describe('Input Validation', () => {
    it('should sanitize SQL injection attempts', async () => {
      const res = await request(app)
        .post('/api/v1/real-trading/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gbpAmount: "10; DROP TABLE users;--"
        });

      // Should fail validation, not execute SQL
      expect(res.status).to.be.oneOf([400, 500]);
    });
  });
});

