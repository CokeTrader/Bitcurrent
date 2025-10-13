// Stripe Webhook Handler
const express = require('express');
const stripeService = require('../services/stripe-service');

const router = express.Router();

/**
 * POST /stripe-webhooks
 * Handle Stripe webhook events
 * 
 * Important: This route must use raw body, not JSON parsed body
 */
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(req.body, sig);
    
    console.log(`[Stripe Webhook] Received event: ${event.type}`);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        // Deposit completed
        await stripeService.handleSuccessfulPayment(event.data.object);
        break;
        
      case 'payout.paid':
        // Withdrawal completed
        await stripeService.handlePayoutSuccess(event.data.object);
        break;
        
      case 'payout.failed':
        // Withdrawal failed - refund user
        await stripeService.handlePayoutFailure(event.data.object);
        break;
        
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
    
    // Acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;


