/**
 * Deposits Routes - Refactored with Service Layer
 */

const express = require('express');
const router = express.Router();
const { financialOperationAuth } = require('../middleware/advanced-auth');
const { smartCsrfProtection } = require('../middleware/csrf-protection');
const DepositService = require('../services/deposit-service');
const logger = require('../utils/logger');

/**
 * POST /api/v1/deposits/stripe-checkout
 * Create Stripe checkout session
 */
router.post('/stripe-checkout',
  smartCsrfProtection,
  financialOperationAuth,
  async (req, res, next) => {
    try {
      const { amount, currency = 'GBP' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          code: 'INVALID_AMOUNT'
        });
      }

      const checkout = await DepositService.createStripeCheckout(
        req.userId,
        amount,
        currency
      );

      res.json({
        success: true,
        sessionId: checkout.sessionId,
        url: checkout.url
      });
    } catch (error) {
      logger.error('Stripe checkout failed', {
        userId: req.userId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/deposits/webhook
 * Stripe webhook endpoint
 */
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle event
      await DepositService.handleStripeWebhook(event);

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook processing failed', { error: error.message });
      res.status(400).json({ error: 'Webhook error' });
    }
  }
);

/**
 * GET /api/v1/deposits
 * Get deposit history
 */
router.get('/',
  financialOperationAuth,
  async (req, res, next) => {
    try {
      const { status, limit, offset } = req.query;

      const deposits = await DepositService.getDepositHistory(req.userId, {
        status,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0
      });

      res.json({
        success: true,
        deposits,
        pagination: {
          limit: parseInt(limit) || 50,
          offset: parseInt(offset) || 0,
          hasMore: deposits.length === (parseInt(limit) || 50)
        }
      });
    } catch (error) {
      logger.error('Failed to fetch deposits', {
        userId: req.userId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/deposits/:depositId
 * Get specific deposit
 */
router.get('/:depositId',
  financialOperationAuth,
  async (req, res, next) => {
    try {
      const deposit = await DepositService.getDepositById(
        req.params.depositId,
        req.userId
      );

      if (!deposit) {
        return res.status(404).json({
          error: 'Deposit not found',
          code: 'DEPOSIT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        deposit
      });
    } catch (error) {
      logger.error('Failed to fetch deposit', {
        depositId: req.params.depositId,
        error: error.message
      });
      next(error);
    }
  }
);

module.exports = router;

