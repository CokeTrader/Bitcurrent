// Stripe Payment Service - Deposits & Withdrawals
const Stripe = require('stripe');
const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const ledger = require('./ledger');

require('dotenv').config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create Stripe Checkout session for deposit
 * @param {string} userId - User ID
 * @param {number} amount - Amount in GBP
 * @param {string} successUrl - Redirect URL on success
 * @param {string} cancelUrl - Redirect URL on cancel
 */
async function createDepositCheckoutSession(userId, amount, successUrl, cancelUrl) {
  try {
    // Get user email
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    const userEmail = userResult.rows[0]?.email;
    
    // Create deposit record
    const depositId = uuidv4();
    await query(
      `INSERT INTO deposits (id, user_id, amount, currency, status, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [depositId, userId, amount, 'GBP', 'PENDING', 'stripe']
    );
    
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'BitCurrent Deposit',
              description: `Add £${amount.toFixed(2)} to your BitCurrent account`,
            },
            unit_amount: Math.round(amount * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        deposit_id: depositId,
        user_id: userId,
        type: 'deposit'
      },
    });
    
    // Update deposit with Stripe session ID
    await query(
      'UPDATE deposits SET provider_transaction_id = $1 WHERE id = $2',
      [session.id, depositId]
    );
    
    console.log(`✅ Created Stripe deposit session for user ${userId}: £${amount}`);
    
    return {
      sessionId: session.id,
      url: session.url,
      depositId
    };
  } catch (error) {
    console.error('Stripe create deposit error:', error.message);
    throw new Error('Failed to create deposit session');
  }
}

/**
 * Handle successful payment webhook from Stripe
 * @param {object} session - Stripe session object
 */
async function handleSuccessfulPayment(session) {
  try {
    const { deposit_id, user_id } = session.metadata;
    
    console.log(`[Stripe Webhook] Processing successful payment for deposit ${deposit_id}`);
    
    // Get deposit details
    const depositResult = await query(
      'SELECT * FROM deposits WHERE id = $1',
      [deposit_id]
    );
    
    if (depositResult.rows.length === 0) {
      throw new Error(`Deposit ${deposit_id} not found`);
    }
    
    const deposit = depositResult.rows[0];
    
    if (deposit.status === 'COMPLETED') {
      console.log(`[Stripe Webhook] Deposit ${deposit_id} already completed, skipping`);
      return;
    }
    
    // Credit user's account
    await ledger.credit(
      user_id,
      'GBP',
      parseFloat(deposit.amount),
      'DEPOSIT',
      'DEPOSIT',
      deposit_id,
      'Stripe deposit'
    );
    
    // Update deposit status
    await query(
      'UPDATE deposits SET status = $1, completed_at = NOW() WHERE id = $2',
      ['COMPLETED', deposit_id]
    );
    
    console.log(`✅ Deposit ${deposit_id} completed: £${deposit.amount} credited to user ${user_id}`);
    
    return {
      success: true,
      depositId: deposit_id,
      amount: deposit.amount
    };
  } catch (error) {
    console.error('[Stripe Webhook] Error handling successful payment:', error.message);
    throw error;
  }
}

/**
 * Create payout (withdrawal) to user's bank account
 * @param {string} userId - User ID
 * @param {number} amount - Amount in GBP
 * @param {object} bankDetails - Bank account details
 */
async function createPayout(userId, amount, bankDetails) {
  try {
    console.log(`[Stripe] Creating payout for user ${userId}: £${amount}`);
    
    // Deduct £1 withdrawal fee
    const withdrawalFee = 1.00;
    const netAmount = amount - withdrawalFee;
    
    if (netAmount <= 0) {
      throw new Error('Amount too small after fee deduction');
    }
    
    // Create withdrawal record
    const withdrawalId = uuidv4();
    await query(
      `INSERT INTO withdrawals (id, user_id, amount, currency, fee, status, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [withdrawalId, userId, amount, 'GBP', withdrawalFee, 'PENDING', 'stripe']
    );
    
    // Debit user's balance (amount + fee)
    await ledger.debit(
      userId,
      'GBP',
      amount, // Total including fee
      'WITHDRAWAL',
      'WITHDRAWAL',
      withdrawalId,
      'Withdrawal to bank account'
    );
    
    // Create or get Stripe Connect account for user
    // For MVP, use manual payouts to avoid complex onboarding
    
    // Create payout
    const payout = await stripe.payouts.create({
      amount: Math.round(netAmount * 100), // Convert to pence
      currency: 'gbp',
      description: `BitCurrent withdrawal - ${withdrawalId}`,
      metadata: {
        withdrawal_id: withdrawalId,
        user_id: userId
      }
    });
    
    // Update withdrawal with Stripe payout ID
    await query(
      'UPDATE withdrawals SET provider_transaction_id = $1, status = $2 WHERE id = $3',
      [payout.id, 'PROCESSING', withdrawalId]
    );
    
    console.log(`✅ Payout created for withdrawal ${withdrawalId}: £${netAmount} (after £${withdrawalFee} fee)`);
    
    return {
      withdrawalId,
      payoutId: payout.id,
      amount: netAmount,
      fee: withdrawalFee,
      status: 'PROCESSING'
    };
  } catch (error) {
    console.error('[Stripe] Create payout error:', error.message);
    throw new Error('Failed to create payout');
  }
}

/**
 * Handle payout success webhook
 */
async function handlePayoutSuccess(payout) {
  try {
    const { withdrawal_id } = payout.metadata;
    
    console.log(`[Stripe Webhook] Payout successful for withdrawal ${withdrawal_id}`);
    
    // Update withdrawal status
    await query(
      'UPDATE withdrawals SET status = $1, completed_at = NOW() WHERE id = $2',
      ['COMPLETED', withdrawal_id]
    );
    
    console.log(`✅ Withdrawal ${withdrawal_id} completed`);
    
    return { success: true, withdrawalId: withdrawal_id };
  } catch (error) {
    console.error('[Stripe Webhook] Error handling payout success:', error.message);
    throw error;
  }
}

/**
 * Handle payout failure webhook
 */
async function handlePayoutFailure(payout) {
  try {
    const { withdrawal_id, user_id } = payout.metadata;
    
    console.log(`[Stripe Webhook] Payout failed for withdrawal ${withdrawal_id}`);
    
    // Get withdrawal details
    const withdrawalResult = await query(
      'SELECT * FROM withdrawals WHERE id = $1',
      [withdrawal_id]
    );
    
    if (withdrawalResult.rows.length > 0) {
      const withdrawal = withdrawalResult.rows[0];
      
      // Refund the amount back to user (they were already debited)
      await ledger.credit(
        user_id,
        'GBP',
        parseFloat(withdrawal.amount),
        'REFUND',
        'WITHDRAWAL',
        withdrawal_id,
        'Withdrawal refund - payout failed'
      );
      
      // Update withdrawal status
      await query(
        'UPDATE withdrawals SET status = $1 WHERE id = $2',
        ['FAILED', withdrawal_id]
      );
      
      console.log(`✅ Withdrawal ${withdrawal_id} refunded to user`);
    }
    
    return { success: true, withdrawalId: withdrawal_id };
  } catch (error) {
    console.error('[Stripe Webhook] Error handling payout failure:', error.message);
    throw error;
  }
}

/**
 * Get Stripe publishable key for frontend
 */
function getPublishableKey() {
  return process.env.STRIPE_PUBLISHABLE_KEY;
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error.message);
    throw new Error('Invalid webhook signature');
  }
}

module.exports = {
  createDepositCheckoutSession,
  handleSuccessfulPayment,
  createPayout,
  handlePayoutSuccess,
  handlePayoutFailure,
  getPublishableKey,
  verifyWebhookSignature
};


