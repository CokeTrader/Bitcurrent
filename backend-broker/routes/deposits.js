// Deposits routes
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const stripeService = require('../services/stripe-service');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * POST /deposits/stripe-checkout
 * Create Stripe Checkout session for instant deposit
 */
router.post('/stripe-checkout', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum deposit is £10'
      });
    }
    
    // Create Stripe Checkout session
    const baseUrl = process.env.FRONTEND_URL || 'https://bitcurrent.vercel.app';
    const session = await stripeService.createDepositCheckoutSession(
      userId,
      amountNum,
      `${baseUrl}/dashboard?deposit=success`,
      `${baseUrl}/deposit?cancelled=true`
    );
    
    res.json({
      success: true,
      sessionId: session.sessionId,
      url: session.url,
      depositId: session.depositId
    });
  } catch (error) {
    console.error('Create Stripe checkout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create deposit session'
    });
  }
});

/**
 * POST /deposits
 * Create deposit request (manual bank transfer)
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { currency, amount } = req.body;
    
    // Validation
    if (!currency || !amount) {
      return res.status(400).json({
        success: false,
        error: 'currency and amount are required'
      });
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number'
      });
    }
    
    // Only GBP for MVP
    if (currency.toUpperCase() !== 'GBP') {
      return res.status(400).json({
        success: false,
        error: 'Only GBP deposits supported for now'
      });
    }
    
    // Check minimum deposit
    const minDeposit = 10; // £10 minimum
    if (amountNum < minDeposit) {
      return res.status(400).json({
        success: false,
        error: `Minimum deposit is £${minDeposit}`
      });
    }
    
    // Generate unique reference code
    const bankReference = `BC${userId.substring(0, 8).toUpperCase()}${Date.now().toString().substring(-6)}`;
    
    // Create deposit request
    const depositId = uuidv4();
    await query(
      `INSERT INTO deposits (id, user_id, currency, amount, bank_reference, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [depositId, userId, currency.toUpperCase(), amountNum, bankReference, 'bank_transfer', 'PENDING']
    );
    
    res.status(201).json({
      success: true,
      message: 'Deposit request created',
      deposit: {
        id: depositId,
        currency: currency.toUpperCase(),
        amount: amountNum,
        bankReference,
        status: 'PENDING',
        instructions: {
          accountName: 'BitCurrent Ltd',
          sortCode: '04-00-04',
          accountNumber: '12345678',
          reference: bankReference,
          note: 'Please include the reference code in your bank transfer. Funds will be credited within 1-2 hours during business hours.'
        }
      }
    });
  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create deposit request'
    });
  }
});

/**
 * GET /deposits
 * Get user's deposit history
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await query(
      `SELECT id, currency, amount, bank_reference, payment_method, status,
              rejection_reason, created_at, approved_at, credited_at
       FROM deposits
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const deposits = result.rows.map(row => ({
      id: row.id,
      currency: row.currency,
      amount: parseFloat(row.amount),
      bankReference: row.bank_reference,
      paymentMethod: row.payment_method,
      status: row.status,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      approvedAt: row.approved_at,
      creditedAt: row.credited_at
    }));
    
    res.json({
      success: true,
      deposits,
      pagination: {
        limit,
        offset,
        total: deposits.length
      }
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deposits'
    });
  }
});

/**
 * GET /deposits/:id
 * Get specific deposit details
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const depositId = req.params.id;
    
    const result = await query(
      `SELECT id, currency, amount, bank_reference, payment_method, status,
              rejection_reason, notes, created_at, approved_at, credited_at
       FROM deposits
       WHERE id = $1 AND user_id = $2`,
      [depositId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found'
      });
    }
    
    const deposit = result.rows[0];
    
    res.json({
      success: true,
      deposit: {
        id: deposit.id,
        currency: deposit.currency,
        amount: parseFloat(deposit.amount),
        bankReference: deposit.bank_reference,
        paymentMethod: deposit.payment_method,
        status: deposit.status,
        rejectionReason: deposit.rejection_reason,
        notes: deposit.notes,
        createdAt: deposit.created_at,
        approvedAt: deposit.approved_at,
        creditedAt: deposit.credited_at
      }
    });
  } catch (error) {
    console.error('Get deposit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deposit'
    });
  }
});

module.exports = router;

