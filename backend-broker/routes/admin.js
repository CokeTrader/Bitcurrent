// Admin routes - for manual operations
const express = require('express');
const { query, transaction } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ledger = require('../services/ledger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);
router.use(requireAdmin);

/**
 * GET /admin/deposits/pending
 * Get pending deposit requests
 */
router.get('/deposits/pending', async (req, res) => {
  try {
    const result = await query(
      `SELECT d.id, d.currency, d.amount, d.bank_reference, d.payment_method,
              d.created_at, u.email, u.first_name, u.last_name
       FROM deposits d
       JOIN users u ON d.user_id = u.id
       WHERE d.status = 'PENDING'
       ORDER BY d.created_at ASC`
    );
    
    const deposits = result.rows.map(row => ({
      id: row.id,
      currency: row.currency,
      amount: parseFloat(row.amount),
      bankReference: row.bank_reference,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      user: {
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name
      }
    }));
    
    res.json({
      success: true,
      deposits
    });
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending deposits'
    });
  }
});

/**
 * POST /admin/deposits/:id/approve
 * Approve deposit and credit user account
 */
router.post('/deposits/:id/approve', async (req, res) => {
  try {
    const adminId = req.user.id;
    const depositId = req.params.id;
    
    // Get deposit
    const depositResult = await query(
      'SELECT user_id, currency, amount, status FROM deposits WHERE id = $1',
      [depositId]
    );
    
    if (depositResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found'
      });
    }
    
    const deposit = depositResult.rows[0];
    
    if (deposit.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Deposit already processed'
      });
    }
    
    // Credit user account and update deposit
    await transaction(async (client) => {
      // Credit user account
      const txResult = await ledger.credit(
        deposit.user_id,
        deposit.currency,
        parseFloat(deposit.amount),
        'DEPOSIT',
        'DEPOSIT',
        depositId,
        `${deposit.currency} deposit approved`
      );
      
      // Update deposit status
      await client.query(
        `UPDATE deposits 
         SET status = $1, approved_by = $2, approved_at = NOW(), 
             credited_at = NOW(), transaction_id = $3
         WHERE id = $4`,
        ['CREDITED', adminId, txResult.transactionId, depositId]
      );
      
      // Log admin action
      await client.query(
        `INSERT INTO admin_logs (id, admin_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), adminId, 'APPROVE_DEPOSIT', 'DEPOSIT', depositId, JSON.stringify({ amount: deposit.amount, currency: deposit.currency })]
      );
    });
    
    res.json({
      success: true,
      message: 'Deposit approved and credited successfully'
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve deposit'
    });
  }
});

/**
 * POST /admin/deposits/:id/reject
 * Reject deposit request
 */
router.post('/deposits/:id/reject', async (req, res) => {
  try {
    const adminId = req.user.id;
    const depositId = req.params.id;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }
    
    const result = await query(
      'UPDATE deposits SET status = $1, rejection_reason = $2, approved_by = $3, approved_at = NOW() WHERE id = $4 AND status = $5 RETURNING currency, amount',
      ['REJECTED', reason, adminId, depositId, 'PENDING']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found or already processed'
      });
    }
    
    // Log admin action
    await query(
      `INSERT INTO admin_logs (id, admin_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), adminId, 'REJECT_DEPOSIT', 'DEPOSIT', depositId, JSON.stringify({ reason })]
    );
    
    res.json({
      success: true,
      message: 'Deposit rejected successfully'
    });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject deposit'
    });
  }
});

/**
 * GET /admin/withdrawals/pending
 * Get pending withdrawal requests
 */
router.get('/withdrawals/pending', async (req, res) => {
  try {
    const result = await query(
      `SELECT w.id, w.currency, w.amount, w.destination, w.destination_type,
              w.bank_account_name, w.bank_sort_code, w.bank_account_number,
              w.crypto_address, w.crypto_network, w.created_at,
              u.email, u.first_name, u.last_name, u.kyc_status
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'PENDING'
       ORDER BY w.created_at ASC`
    );
    
    const withdrawals = result.rows.map(row => ({
      id: row.id,
      currency: row.currency,
      amount: parseFloat(row.amount),
      destination: row.destination,
      destinationType: row.destination_type,
      bankDetails: row.destination_type === 'BANK' ? {
        accountName: row.bank_account_name,
        sortCode: row.bank_sort_code,
        accountNumber: row.bank_account_number
      } : null,
      cryptoDetails: row.destination_type === 'CRYPTO' ? {
        address: row.crypto_address,
        network: row.crypto_network
      } : null,
      createdAt: row.created_at,
      user: {
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        kycStatus: row.kyc_status
      }
    }));
    
    res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending withdrawals'
    });
  }
});

/**
 * POST /admin/withdrawals/:id/approve
 * Approve withdrawal (admin still needs to process manually)
 */
router.post('/withdrawals/:id/approve', async (req, res) => {
  try {
    const adminId = req.user.id;
    const withdrawalId = req.params.id;
    
    const result = await query(
      'UPDATE withdrawals SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 AND status = $4 RETURNING currency, amount',
      ['APPROVED', adminId, withdrawalId, 'PENDING']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found or already processed'
      });
    }
    
    // Log admin action
    await query(
      `INSERT INTO admin_logs (id, admin_id, action, resource_type, resource_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), adminId, 'APPROVE_WITHDRAWAL', 'WITHDRAWAL', withdrawalId]
    );
    
    res.json({
      success: true,
      message: 'Withdrawal approved. Please process it manually via Binance or bank transfer.'
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve withdrawal'
    });
  }
});

/**
 * POST /admin/withdrawals/:id/complete
 * Mark withdrawal as completed after manual processing
 */
router.post('/withdrawals/:id/complete', async (req, res) => {
  try {
    const adminId = req.user.id;
    const withdrawalId = req.params.id;
    const { providerTxId } = req.body;
    
    // Get withdrawal
    const withdrawalResult = await query(
      'SELECT user_id, currency, amount, status FROM withdrawals WHERE id = $1',
      [withdrawalId]
    );
    
    if (withdrawalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found'
      });
    }
    
    const withdrawal = withdrawalResult.rows[0];
    
    if (withdrawal.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Withdrawal must be approved first'
      });
    }
    
    // Debit user account and complete withdrawal
    await transaction(async (client) => {
      // Debit from reserved balance
      const accountResult = await client.query(
        'SELECT id, reserved FROM accounts WHERE user_id = $1 AND currency = $2 FOR UPDATE',
        [withdrawal.user_id, withdrawal.currency]
      );
      
      const account = accountResult.rows[0];
      const amount = parseFloat(withdrawal.amount);
      
      // Update account (remove from balance and reserved)
      await client.query(
        'UPDATE accounts SET balance = balance - $1, reserved = reserved - $1 WHERE id = $2',
        [amount, account.id]
      );
      
      // Create transaction record
      const txResult = await ledger.debit(
        withdrawal.user_id,
        withdrawal.currency,
        amount,
        'WITHDRAWAL',
        'WITHDRAWAL',
        withdrawalId,
        `${withdrawal.currency} withdrawal completed`
      );
      
      // Update withdrawal status
      await client.query(
        `UPDATE withdrawals 
         SET status = $1, processed_by = $2, processed_at = NOW(), 
             completed_at = NOW(), provider_tx_id = $3, transaction_id = $4
         WHERE id = $5`,
        ['COMPLETED', adminId, providerTxId, txResult.transactionId, withdrawalId]
      );
      
      // Log admin action
      await client.query(
        `INSERT INTO admin_logs (id, admin_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), adminId, 'COMPLETE_WITHDRAWAL', 'WITHDRAWAL', withdrawalId, JSON.stringify({ providerTxId })]
      );
    });
    
    res.json({
      success: true,
      message: 'Withdrawal completed successfully'
    });
  } catch (error) {
    console.error('Complete withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete withdrawal'
    });
  }
});

/**
 * POST /admin/withdrawals/:id/reject
 * Reject withdrawal and release funds
 */
router.post('/withdrawals/:id/reject', async (req, res) => {
  try {
    const adminId = req.user.id;
    const withdrawalId = req.params.id;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }
    
    // Get withdrawal
    const withdrawalResult = await query(
      'SELECT user_id, currency, amount, status FROM withdrawals WHERE id = $1',
      [withdrawalId]
    );
    
    if (withdrawalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found'
      });
    }
    
    const withdrawal = withdrawalResult.rows[0];
    
    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Can only reject pending withdrawals'
      });
    }
    
    // Release reserved funds
    await ledger.release(
      withdrawal.user_id,
      withdrawal.currency,
      parseFloat(withdrawal.amount),
      'WITHDRAWAL',
      withdrawalId
    );
    
    // Update withdrawal status
    await query(
      'UPDATE withdrawals SET status = $1, rejection_reason = $2, approved_by = $3, approved_at = NOW() WHERE id = $4',
      ['REJECTED', reason, adminId, withdrawalId]
    );
    
    // Log admin action
    await query(
      `INSERT INTO admin_logs (id, admin_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), adminId, 'REJECT_WITHDRAWAL', 'WITHDRAWAL', withdrawalId, JSON.stringify({ reason })]
    );
    
    res.json({
      success: true,
      message: 'Withdrawal rejected and funds released'
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject withdrawal'
    });
  }
});

/**
 * GET /admin/users
 * Get all users with KYC status
 */
router.get('/users', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, kyc_status, status, created_at, last_login
       FROM users
       ORDER BY created_at DESC
       LIMIT 100`
    );
    
    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      kycStatus: row.kyc_status,
      status: row.status,
      createdAt: row.created_at,
      lastLogin: row.last_login
    }));
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

/**
 * GET /admin/stats
 * Get platform statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = {};
    
    // Total users
    const usersResult = await query('SELECT COUNT(*) FROM users');
    stats.totalUsers = parseInt(usersResult.rows[0].count);
    
    // Pending deposits
    const depositsResult = await query('SELECT COUNT(*), SUM(amount) FROM deposits WHERE status = $1', ['PENDING']);
    stats.pendingDeposits = {
      count: parseInt(depositsResult.rows[0].count),
      total: parseFloat(depositsResult.rows[0].sum) || 0
    };
    
    // Pending withdrawals
    const withdrawalsResult = await query('SELECT COUNT(*), SUM(amount) FROM withdrawals WHERE status = $1', ['PENDING']);
    stats.pendingWithdrawals = {
      count: parseInt(withdrawalsResult.rows[0].count),
      total: parseFloat(withdrawalsResult.rows[0].sum) || 0
    };
    
    // Total orders today
    const ordersResult = await query(
      "SELECT COUNT(*), SUM(quote_amount) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours'"
    );
    stats.ordersLast24h = {
      count: parseInt(ordersResult.rows[0].count),
      volume: parseFloat(ordersResult.rows[0].sum) || 0
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

/**
 * POST /admin/grant-paper-funds
 * Grant paper trading funds to a user (admin only, paper mode only)
 */
router.post('/grant-paper-funds', async (req, res) => {
  try {
    if (process.env.ALPACA_PAPER !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'Paper funds only available in paper trading mode'
      });
    }
    
    const { userId, amount = 10000 } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }
    
    // Create or update GBP account with paper funds
    await query(
      `INSERT INTO accounts (user_id, currency, balance, available, reserved)
       VALUES ($1, 'GBP', $2, $2, 0)
       ON CONFLICT (user_id, currency) 
       DO UPDATE SET balance = accounts.balance + $2, available = accounts.available + $2`,
      [userId, amount]
    );
    
    // Log the paper fund grant
    await query(
      `INSERT INTO transactions (id, user_id, currency, transaction_type, amount, status, description, created_at)
       VALUES ($1, $2, 'GBP', 'paper_grant', $3, 'completed', 'Paper trading funds granted by admin', NOW())`,
      [uuidv4(), userId, amount]
    );
    
    res.json({
      success: true,
      message: `Granted £${amount.toLocaleString()} paper trading funds to user ${userId}`,
      userId,
      amount
    });
    
  } catch (error) {
    console.error('Grant paper funds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant paper funds'
    });
  }
});

module.exports = router;

