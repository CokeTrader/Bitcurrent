// Withdrawals routes
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const ledger = require('../services/ledger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * POST /withdrawals
 * Create withdrawal request
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { currency, amount, destination, destinationType, bankDetails, cryptoDetails } = req.body;
    
    // Validation
    if (!currency || !amount || !destination || !destinationType) {
      return res.status(400).json({
        success: false,
        error: 'currency, amount, destination, and destinationType are required'
      });
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number'
      });
    }
    
    if (!['BANK', 'CRYPTO'].includes(destinationType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'destinationType must be BANK or CRYPTO'
      });
    }
    
    // Check minimum withdrawal
    const minWithdrawal = 10;
    if (amountNum < minWithdrawal) {
      return res.status(400).json({
        success: false,
        error: `Minimum withdrawal is ${currency} ${minWithdrawal}`
      });
    }
    
    // Check balance
    const balance = await ledger.getBalance(userId, currency.toUpperCase());
    if (balance.available < amountNum) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${balance.available}, Required: ${amountNum}`
      });
    }
    
    // Create withdrawal request
    const withdrawalId = uuidv4();
    
    if (destinationType.toUpperCase() === 'BANK') {
      await query(
        `INSERT INTO withdrawals 
         (id, user_id, currency, amount, destination, destination_type, 
          bank_account_name, bank_sort_code, bank_account_number, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          withdrawalId, 
          userId, 
          currency.toUpperCase(), 
          amountNum, 
          destination,
          'BANK',
          bankDetails?.accountName,
          bankDetails?.sortCode,
          bankDetails?.accountNumber,
          'PENDING'
        ]
      );
    } else {
      await query(
        `INSERT INTO withdrawals 
         (id, user_id, currency, amount, destination, destination_type, 
          crypto_address, crypto_network, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          withdrawalId,
          userId,
          currency.toUpperCase(),
          amountNum,
          destination,
          'CRYPTO',
          cryptoDetails?.address,
          cryptoDetails?.network,
          'PENDING'
        ]
      );
    }
    
    // Reserve funds (lock in account)
    await ledger.reserve(userId, currency.toUpperCase(), amountNum, 'WITHDRAWAL', withdrawalId);
    
    res.status(201).json({
      success: true,
      message: 'Withdrawal request created',
      withdrawal: {
        id: withdrawalId,
        currency: currency.toUpperCase(),
        amount: amountNum,
        destination,
        destinationType: destinationType.toUpperCase(),
        status: 'PENDING',
        note: 'Your withdrawal request is pending approval. You will receive an email once approved.'
      }
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create withdrawal request'
    });
  }
});

/**
 * GET /withdrawals
 * Get user's withdrawal history
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await query(
      `SELECT id, currency, amount, destination, destination_type, status,
              rejection_reason, fee, created_at, approved_at, completed_at
       FROM withdrawals
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const withdrawals = result.rows.map(row => ({
      id: row.id,
      currency: row.currency,
      amount: parseFloat(row.amount),
      destination: row.destination,
      destinationType: row.destination_type,
      status: row.status,
      rejectionReason: row.rejection_reason,
      fee: parseFloat(row.fee),
      createdAt: row.created_at,
      approvedAt: row.approved_at,
      completedAt: row.completed_at
    }));
    
    res.json({
      success: true,
      withdrawals,
      pagination: {
        limit,
        offset,
        total: withdrawals.length
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get withdrawals'
    });
  }
});

/**
 * GET /withdrawals/:id
 * Get specific withdrawal details
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawalId = req.params.id;
    
    const result = await query(
      `SELECT id, currency, amount, destination, destination_type, 
              bank_account_name, bank_sort_code, bank_account_number,
              crypto_address, crypto_network, status, rejection_reason,
              provider_tx_id, fee, notes, created_at, approved_at, completed_at
       FROM withdrawals
       WHERE id = $1 AND user_id = $2`,
      [withdrawalId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found'
      });
    }
    
    const withdrawal = result.rows[0];
    
    res.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        currency: withdrawal.currency,
        amount: parseFloat(withdrawal.amount),
        destination: withdrawal.destination,
        destinationType: withdrawal.destination_type,
        bankDetails: withdrawal.destination_type === 'BANK' ? {
          accountName: withdrawal.bank_account_name,
          sortCode: withdrawal.bank_sort_code,
          accountNumber: withdrawal.bank_account_number
        } : null,
        cryptoDetails: withdrawal.destination_type === 'CRYPTO' ? {
          address: withdrawal.crypto_address,
          network: withdrawal.crypto_network
        } : null,
        status: withdrawal.status,
        rejectionReason: withdrawal.rejection_reason,
        providerTxId: withdrawal.provider_tx_id,
        fee: parseFloat(withdrawal.fee),
        notes: withdrawal.notes,
        createdAt: withdrawal.created_at,
        approvedAt: withdrawal.approved_at,
        completedAt: withdrawal.completed_at
      }
    });
  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get withdrawal'
    });
  }
});

/**
 * DELETE /withdrawals/:id
 * Cancel pending withdrawal
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawalId = req.params.id;
    
    // Get withdrawal
    const result = await query(
      'SELECT currency, amount, status FROM withdrawals WHERE id = $1 AND user_id = $2',
      [withdrawalId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found'
      });
    }
    
    const withdrawal = result.rows[0];
    
    // Can only cancel pending withdrawals
    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Can only cancel pending withdrawals'
      });
    }
    
    // Release reserved funds
    await ledger.release(userId, withdrawal.currency, parseFloat(withdrawal.amount), 'WITHDRAWAL', withdrawalId);
    
    // Update withdrawal status
    await query(
      'UPDATE withdrawals SET status = $1, cancelled_at = NOW() WHERE id = $2',
      ['CANCELLED', withdrawalId]
    );
    
    res.json({
      success: true,
      message: 'Withdrawal cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel withdrawal'
    });
  }
});

module.exports = router;

