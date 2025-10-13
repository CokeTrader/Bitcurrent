/**
 * Trading Bots - Unit Tests
 * 
 * Test DCA, Grid, and RSI bots
 */

const { expect } = require('chai');
const tradingBotService = require('../services/trading-bot-service');
const pool = require('../config/database');

describe('Trading Bot Service', () => {
  let testUserId;

  before(async () => {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, gbp_balance, btc_balance, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      ['bots@test.com', 'hashed', 5000.00, 0]
    );
    testUserId = result.rows[0].id;
  });

  after(async () => {
    await pool.query('DELETE FROM bot_executions WHERE bot_id IN (SELECT id FROM trading_bots WHERE user_id = $1)', [testUserId]);
    await pool.query('DELETE FROM trading_bots WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('DCA Bot', () => {
    it('should create DCA bot', async () => {
      const result = await tradingBotService.createDCABot(testUserId, {
        name: 'Test DCA',
        asset: 'BTC',
        amount: 100,
        intervalHours: 24
      });

      expect(result.success).to.be.true;
      expect(result.bot).to.exist;
      expect(result.bot.type).to.equal('dca');
    });

    it('should reject DCA bot with missing fields', async () => {
      const result = await tradingBotService.createDCABot(testUserId, {
        asset: 'BTC'
        // Missing amount and intervalHours
      });

      expect(result.success).to.be.false;
      expect(result.error).to.include('Missing');
    });
  });

  describe('Grid Bot', () => {
    it('should create grid bot', async () => {
      const result = await tradingBotService.createGridBot(testUserId, {
        name: 'Test Grid',
        asset: 'BTC',
        lowerPrice: 35000,
        upperPrice: 45000,
        gridLevels: 10,
        totalAmount: 1000
      });

      expect(result.success).to.be.true;
      expect(result.bot.type).to.equal('grid');
    });
  });

  describe('RSI Bot', () => {
    it('should create RSI bot', async () => {
      const result = await tradingBotService.createRSIBot(testUserId, {
        name: 'Test RSI',
        asset: 'BTC',
        buyRSI: 30,
        sellRSI: 70,
        tradeAmount: 50
      });

      expect(result.success).to.be.true;
      expect(result.bot.type).to.equal('rsi');
    });
  });

  describe('Bot Management', () => {
    let botId;

    before(async () => {
      const result = await tradingBotService.createDCABot(testUserId, {
        asset: 'ETH',
        amount: 50,
        intervalHours: 12
      });
      botId = result.bot.id;
    });

    it('should pause bot', async () => {
      const result = await tradingBotService.updateBotStatus(
        testUserId,
        botId,
        'paused'
      );

      expect(result.success).to.be.true;
      expect(result.bot.status).to.equal('paused');
    });

    it('should resume bot', async () => {
      const result = await tradingBotService.updateBotStatus(
        testUserId,
        botId,
        'active'
      );

      expect(result.success).to.be.true;
      expect(result.bot.status).to.equal('active');
    });

    it('should delete bot', async () => {
      const result = await tradingBotService.deleteBot(testUserId, botId);

      expect(result.success).to.be.true;
    });
  });

  describe('Bot Statistics', () => {
    it('should return bot stats', async () => {
      // Create and execute a bot
      const createResult = await tradingBotService.createDCABot(testUserId, {
        asset: 'BTC',
        amount: 100,
        intervalHours: 24
      });

      const stats = await tradingBotService.getBotStats(testUserId, createResult.bot.id);

      expect(stats.success).to.be.true;
      expect(stats.stats).to.have.property('total_executions');
    });
  });
});

