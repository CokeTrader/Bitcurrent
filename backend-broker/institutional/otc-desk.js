/**
 * OTC (Over-The-Counter) Trading Desk
 * Large block trades with minimal slippage
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');

class OTCDeskService {
  /**
   * Request OTC quote
   */
  static async requestQuote(userId, quoteRequest) {
    const { pair, side, amount, urgency } = quoteRequest;

    // Minimum OTC trade: £50,000
    const minOTCSize = 50000;
    const estimatedValue = amount * 67000; // Mock price

    if (estimatedValue < minOTCSize) {
      throw new Error(`OTC desk minimum is £${minOTCSize.toLocaleString()}. Use standard trading for smaller amounts.`);
    }

    // Create quote request
    const quote = await qb.insert('otc_quotes', {
      user_id: userId,
      pair,
      side,
      amount,
      urgency: urgency || 'normal',
      status: 'pending',
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minute expiry
      created_at: new Date()
    });

    // Notify OTC desk team
    logger.info('OTC quote requested', {
      userId,
      quoteId: quote.id,
      pair,
      amount,
      estimatedValue
    });

    // In production: Alert OTC desk via Slack/email
    await this.alertOTCDesk(quote);

    return quote;
  }

  /**
   * Provide quote (desk response)
   */
  static async provideQuote(quoteId, quoteData, deskUserId) {
    const { price, slippage, fee, validUntil } = quoteData;

    await qb.update('otc_quotes',
      {
        quoted_price: price,
        slippage_percent: slippage,
        fee_percent: fee,
        valid_until: validUntil,
        quoted_by: deskUserId,
        quoted_at: new Date(),
        status: 'quoted'
      },
      { id: quoteId }
    );

    const quote = (await qb.select('otc_quotes', { id: quoteId }))[0];

    // Notify user
    logger.info('OTC quote provided', {
      quoteId,
      price,
      fee
    });

    return quote;
  }

  /**
   * Accept quote and execute trade
   */
  static async acceptQuote(quoteId, userId) {
    const quote = (await qb.select('otc_quotes', { id: quoteId, user_id: userId }))[0];

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'quoted') {
      throw new Error('Quote is not available');
    }

    if (new Date() > new Date(quote.valid_until)) {
      throw new Error('Quote has expired');
    }

    // Execute OTC trade
    await qb.update('otc_quotes',
      {
        status: 'executed',
        executed_at: new Date()
      },
      { id: quoteId }
    );

    // Create order record
    const order = await qb.insert('orders', {
      user_id: userId,
      pair: quote.pair,
      side: quote.side,
      amount: quote.amount,
      price: quote.quoted_price,
      type: 'otc',
      fee: quote.amount * quote.quoted_price * (quote.fee_percent / 100),
      status: 'filled',
      otc_quote_id: quoteId,
      created_at: new Date()
    });

    logger.info('OTC trade executed', {
      userId,
      quoteId,
      orderId: order.id,
      amount: quote.amount,
      price: quote.quoted_price
    });

    return { quote, order };
  }

  /**
   * Alert OTC desk team
   */
  static async alertOTCDesk(quote) {
    // In production: Send Slack message or email to OTC desk
    logger.info('OTC desk alerted', {
      quoteId: quote.id,
      pair: quote.pair,
      amount: quote.amount,
      urgency: quote.urgency
    });
  }

  /**
   * Get OTC quote history
   */
  static async getQuoteHistory(userId, limit = 50) {
    const sql = `
      SELECT * FROM otc_quotes
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    return await qb.query(sql, [userId, limit]);
  }

  /**
   * Get pending quotes for OTC desk
   */
  static async getPendingQuotes(limit = 20) {
    return await qb.select('otc_quotes', 
      { status: 'pending' },
      'id, user_id, pair, side, amount, urgency, created_at'
    );
  }
}

module.exports = OTCDeskService;

