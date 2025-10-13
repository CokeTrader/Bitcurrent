/**
 * Deposit Service
 * Handle all deposit-related business logic
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');
const EmailService = require('../utils/email-service');

class DepositService {
  /**
   * Create Stripe checkout session
   */
  static async createStripeCheckout(userId, amount, currency = 'GBP') {
    try {
      // Validate amount
      if (amount < 10) {
        throw new Error('Minimum deposit is £10');
      }
      if (amount > 10000) {
        throw new Error('Maximum deposit is £10,000');
      }

      // Get user email
      const users = await qb.select('users', { id: userId });
      const user = users[0];

      if (!user) {
        throw new Error('User not found');
      }

      // Create Stripe session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'BitCurrent Deposit',
                description: `Deposit ${amount} ${currency} to your trading account`,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/deposit/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/deposit/cancel`,
        client_reference_id: userId.toString(),
        customer_email: user.email,
        metadata: {
          userId: userId.toString(),
          type: 'deposit',
          currency
        }
      });

      // Record pending deposit
      await qb.insert('deposits', {
        user_id: userId,
        amount,
        currency,
        status: 'pending',
        stripe_session_id: session.id,
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info('Stripe checkout session created', {
        userId,
        sessionId: session.id,
        amount,
        currency
      });

      return {
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      logger.error('Failed to create Stripe session', {
        userId,
        amount,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle Stripe webhook (payment succeeded)
   */
  static async handleStripeWebhook(event) {
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = parseInt(session.metadata.userId);
        const amount = session.amount_total / 100; // Convert from cents
        const currency = session.metadata.currency;

        // Update deposit status
        await qb.update('deposits',
          {
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent,
            completed_at: new Date(),
            updated_at: new Date()
          },
          { stripe_session_id: session.id }
        );

        // Credit user balance
        await this.creditUserBalance(userId, amount, currency);

        // Send confirmation email
        await EmailService.sendDepositConfirmation(userId, amount, currency);

        // Check if eligible for signup bonus
        await this.checkSignupBonus(userId);

        logger.info('Deposit completed successfully', {
          userId,
          sessionId: session.id,
          amount,
          currency
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error('Stripe webhook processing failed', {
        event: event.type,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Credit user balance
   */
  static async creditUserBalance(userId, amount, currency) {
    try {
      // Check if balance record exists
      const existing = await qb.select('balances', { user_id: userId, currency });

      if (existing.length > 0) {
        // Update existing balance
        const newTotal = parseFloat(existing[0].total) + amount;
        const newAvailable = parseFloat(existing[0].available) + amount;

        await qb.update('balances',
          {
            total: newTotal,
            available: newAvailable,
            updated_at: new Date()
          },
          { user_id: userId, currency }
        );
      } else {
        // Create new balance record
        await qb.insert('balances', {
          user_id: userId,
          currency,
          total: amount,
          available: amount,
          locked: 0,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      logger.info('User balance credited', { userId, amount, currency });
    } catch (error) {
      logger.error('Failed to credit balance', {
        userId,
        amount,
        currency,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check and apply signup bonus
   */
  static async checkSignupBonus(userId) {
    try {
      // Check if this is user's first deposit
      const deposits = await qb.select('deposits', { user_id: userId, status: 'completed' });

      if (deposits.length === 1) {
        // First deposit! Apply £10 bonus
        const bonusAmount = 10;
        const bonusCurrency = 'GBP';

        await this.creditUserBalance(userId, bonusAmount, bonusCurrency);

        // Record bonus
        await qb.insert('bonuses', {
          user_id: userId,
          type: 'signup',
          amount: bonusAmount,
          currency: bonusCurrency,
          created_at: new Date()
        });

        logger.info('Signup bonus applied', { userId, amount: bonusAmount });

        // Send bonus notification email
        await EmailService.sendBonusNotification(userId, bonusAmount);
      }
    } catch (error) {
      logger.error('Failed to apply signup bonus', {
        userId,
        error: error.message
      });
      // Don't throw - bonus failure shouldn't block deposit
    }
  }

  /**
   * Get user's deposit history
   */
  static async getDepositHistory(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;

    let conditions = { user_id: userId };
    if (status) conditions.status = status;

    const sql = `
      SELECT * FROM deposits
      WHERE user_id = $1
      ${status ? 'AND status = $2' : ''}
      ORDER BY created_at DESC
      LIMIT $${status ? 3 : 2}
      OFFSET $${status ? 4 : 3}
    `;

    const params = [userId];
    if (status) params.push(status);
    params.push(limit, offset);

    return await qb.query(sql, params);
  }

  /**
   * Get deposit by ID (ensure user owns it)
   */
  static async getDepositById(depositId, userId) {
    const deposits = await qb.select('deposits', { id: depositId, user_id: userId });
    return deposits[0] || null;
  }
}

module.exports = DepositService;

