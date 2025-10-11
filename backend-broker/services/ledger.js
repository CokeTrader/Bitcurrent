// Ledger Service - Balance tracking and transaction management
const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Get user's account balance
 */
async function getBalance(userId, currency) {
  const result = await query(
    'SELECT balance, available, reserved FROM accounts WHERE user_id = $1 AND currency = $2',
    [userId, currency]
  );
  
  if (result.rows.length === 0) {
    return { balance: 0, available: 0, reserved: 0 };
  }
  
  return {
    balance: parseFloat(result.rows[0].balance),
    available: parseFloat(result.rows[0].available),
    reserved: parseFloat(result.rows[0].reserved)
  };
}

/**
 * Get all user balances
 */
async function getAllBalances(userId) {
  const result = await query(
    'SELECT currency, balance, available, reserved FROM accounts WHERE user_id = $1',
    [userId]
  );
  
  return result.rows.map(row => ({
    currency: row.currency,
    balance: parseFloat(row.balance),
    available: parseFloat(row.available),
    reserved: parseFloat(row.reserved)
  }));
}

/**
 * Credit account (add funds)
 * Creates immutable transaction record
 */
async function credit(userId, currency, amount, type, referenceType = null, referenceId = null, description = null) {
  return await transaction(async (client) => {
    // Get account
    const accountResult = await client.query(
      'SELECT id, balance, available FROM accounts WHERE user_id = $1 AND currency = $2 FOR UPDATE',
      [userId, currency]
    );
    
    if (accountResult.rows.length === 0) {
      throw new Error(`Account not found for user ${userId} and currency ${currency}`);
    }
    
    const account = accountResult.rows[0];
    const oldBalance = parseFloat(account.balance);
    const oldAvailable = parseFloat(account.available);
    const newBalance = oldBalance + amount;
    const newAvailable = oldAvailable + amount;
    
    // Update account
    await client.query(
      'UPDATE accounts SET balance = $1, available = $2, updated_at = NOW() WHERE id = $3',
      [newBalance, newAvailable, account.id]
    );
    
    // Create transaction record
    const txResult = await client.query(
      `INSERT INTO transactions 
       (id, user_id, account_id, type, amount, balance_before, balance_after, currency, reference_type, reference_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, created_at`,
      [uuidv4(), userId, account.id, type, amount, oldBalance, newBalance, currency, referenceType, referenceId, description]
    );
    
    return {
      transactionId: txResult.rows[0].id,
      oldBalance,
      newBalance,
      amount,
      timestamp: txResult.rows[0].created_at
    };
  });
}

/**
 * Debit account (remove funds)
 * Creates immutable transaction record
 */
async function debit(userId, currency, amount, type, referenceType = null, referenceId = null, description = null) {
  return await transaction(async (client) => {
    // Get account
    const accountResult = await client.query(
      'SELECT id, balance, available FROM accounts WHERE user_id = $1 AND currency = $2 FOR UPDATE',
      [userId, currency]
    );
    
    if (accountResult.rows.length === 0) {
      throw new Error(`Account not found for user ${userId} and currency ${currency}`);
    }
    
    const account = accountResult.rows[0];
    const oldBalance = parseFloat(account.balance);
    const oldAvailable = parseFloat(account.available);
    
    // Check sufficient balance
    if (oldAvailable < amount) {
      throw new Error(`Insufficient balance. Available: ${oldAvailable}, Required: ${amount}`);
    }
    
    const newBalance = oldBalance - amount;
    const newAvailable = oldAvailable - amount;
    
    // Update account
    await client.query(
      'UPDATE accounts SET balance = $1, available = $2, updated_at = NOW() WHERE id = $3',
      [newBalance, newAvailable, account.id]
    );
    
    // Create transaction record
    const txResult = await client.query(
      `INSERT INTO transactions 
       (id, user_id, account_id, type, amount, balance_before, balance_after, currency, reference_type, reference_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, created_at`,
      [uuidv4(), userId, account.id, type, -amount, oldBalance, newBalance, currency, referenceType, referenceId, description]
    );
    
    return {
      transactionId: txResult.rows[0].id,
      oldBalance,
      newBalance,
      amount,
      timestamp: txResult.rows[0].created_at
    };
  });
}

/**
 * Reserve funds (lock for pending order)
 */
async function reserve(userId, currency, amount, referenceType, referenceId) {
  return await transaction(async (client) => {
    // Get account
    const accountResult = await client.query(
      'SELECT id, available, reserved FROM accounts WHERE user_id = $1 AND currency = $2 FOR UPDATE',
      [userId, currency]
    );
    
    if (accountResult.rows.length === 0) {
      throw new Error(`Account not found for user ${userId} and currency ${currency}`);
    }
    
    const account = accountResult.rows[0];
    const oldAvailable = parseFloat(account.available);
    const oldReserved = parseFloat(account.reserved);
    
    // Check sufficient available balance
    if (oldAvailable < amount) {
      throw new Error(`Insufficient available balance. Available: ${oldAvailable}, Required: ${amount}`);
    }
    
    const newAvailable = oldAvailable - amount;
    const newReserved = oldReserved + amount;
    
    // Update account (move from available to reserved)
    await client.query(
      'UPDATE accounts SET available = $1, reserved = $2, updated_at = NOW() WHERE id = $3',
      [newAvailable, newReserved, account.id]
    );
    
    return {
      available: newAvailable,
      reserved: newReserved
    };
  });
}

/**
 * Release reserved funds (unlock after order cancellation)
 */
async function release(userId, currency, amount, referenceType, referenceId) {
  return await transaction(async (client) => {
    // Get account
    const accountResult = await client.query(
      'SELECT id, available, reserved FROM accounts WHERE user_id = $1 AND currency = $2 FOR UPDATE',
      [userId, currency]
    );
    
    if (accountResult.rows.length === 0) {
      throw new Error(`Account not found`);
    }
    
    const account = accountResult.rows[0];
    const oldAvailable = parseFloat(account.available);
    const oldReserved = parseFloat(account.reserved);
    
    const newAvailable = oldAvailable + amount;
    const newReserved = oldReserved - amount;
    
    // Update account (move from reserved back to available)
    await client.query(
      'UPDATE accounts SET available = $1, reserved = $2, updated_at = NOW() WHERE id = $3',
      [newAvailable, newReserved, account.id]
    );
    
    return {
      available: newAvailable,
      reserved: newReserved
    };
  });
}

/**
 * Get transaction history
 */
async function getTransactionHistory(userId, limit = 50, offset = 0) {
  const result = await query(
    `SELECT id, type, amount, currency, balance_before, balance_after, 
            reference_type, reference_id, description, created_at
     FROM transactions 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    amount: parseFloat(row.amount),
    currency: row.currency,
    balanceBefore: parseFloat(row.balance_before),
    balanceAfter: parseFloat(row.balance_after),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    description: row.description,
    timestamp: row.created_at
  }));
}

module.exports = {
  getBalance,
  getAllBalances,
  credit,
  debit,
  reserve,
  release,
  getTransactionHistory
};

