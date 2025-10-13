/**
 * Cryptocurrency Deposit System
 * Accept BTC, ETH, and other crypto deposits
 */

const crypto = require('crypto');
const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');

class CryptoDepositService {
  /**
   * Generate unique deposit address for user
   */
  static async generateDepositAddress(userId, cryptocurrency) {
    try {
      // In production, use HD wallet derivation (BIP44)
      // For now, generate deterministic address from userId
      const seed = `${userId}-${cryptocurrency}-${process.env.WALLET_SEED}`;
      const hash = crypto.createHash('sha256').update(seed).digest('hex');
      
      // Mock address generation (in production, use proper wallet library)
      const addresses = {
        'BTC': '1' + hash.substring(0, 33), // BTC address format
        'ETH': '0x' + hash.substring(0, 40), // ETH address format
        'SOL': hash.substring(0, 44) // SOL address format
      };

      const address = addresses[cryptocurrency];

      // Save address in database
      await qb.insert('crypto_deposit_addresses', {
        user_id: userId,
        cryptocurrency,
        address,
        created_at: new Date()
      });

      logger.info('Crypto deposit address generated', {
        userId,
        cryptocurrency,
        address
      });

      return { address, cryptocurrency };
    } catch (error) {
      logger.error('Failed to generate deposit address', {
        userId,
        cryptocurrency,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Monitor blockchain for incoming deposits
   * (In production, use blockchain API or run own node)
   */
  static async monitorDeposits() {
    // Check for new deposits every 30 seconds
    const addresses = await qb.select('crypto_deposit_addresses', {});

    for (const addr of addresses) {
      try {
        const txs = await this.checkBlockchain(addr.address, addr.cryptocurrency);
        
        for (const tx of txs) {
          await this.processCryptoDeposit(addr.user_id, tx, addr.cryptocurrency);
        }
      } catch (error) {
        logger.error('Failed to monitor deposits', {
          address: addr.address,
          error: error.message
        });
      }
    }
  }

  /**
   * Check blockchain for transactions
   */
  static async checkBlockchain(address, cryptocurrency) {
    // In production, use blockchain APIs:
    // - Blockchair API
    // - Blockchain.com API
    // - Infura (for ETH)
    // - Or run own full node

    // Mock implementation
    return []; // Return empty array for now
  }

  /**
   * Process crypto deposit
   */
  static async processCryptoDeposit(userId, transaction, cryptocurrency) {
    const { txHash, amount, confirmations } = transaction;

    // Check if already processed
    const existing = await qb.select('crypto_deposits', { tx_hash: txHash });
    if (existing.length > 0) {
      return; // Already processed
    }

    // Record deposit
    const deposit = await qb.insert('crypto_deposits', {
      user_id: userId,
      cryptocurrency,
      amount,
      tx_hash: txHash,
      confirmations,
      status: confirmations >= this.getRequiredConfirmations(cryptocurrency) ? 'confirmed' : 'pending',
      detected_at: new Date(),
      created_at: new Date()
    });

    logger.info('Crypto deposit detected', {
      userId,
      depositId: deposit.id,
      cryptocurrency,
      amount,
      confirmations
    });

    // If confirmed, credit user balance
    if (confirmations >= this.getRequiredConfirmations(cryptocurrency)) {
      await this.creditCryptoBalance(userId, cryptocurrency, amount);
    }

    return deposit;
  }

  /**
   * Get required confirmations by cryptocurrency
   */
  static getRequiredConfirmations(cryptocurrency) {
    const confirmations = {
      'BTC': 3,  // Bitcoin: 3 confirmations (~30 min)
      'ETH': 12, // Ethereum: 12 confirmations (~3 min)
      'SOL': 1   // Solana: 1 confirmation (instant)
    };
    return confirmations[cryptocurrency] || 6;
  }

  /**
   * Credit user's crypto balance
   */
  static async creditCryptoBalance(userId, cryptocurrency, amount) {
    const existing = await qb.select('balances', {
      user_id: userId,
      currency: cryptocurrency
    });

    if (existing.length > 0) {
      await qb.update('balances',
        {
          total: parseFloat(existing[0].total) + amount,
          available: parseFloat(existing[0].available) + amount,
          updated_at: new Date()
        },
        { user_id: userId, currency: cryptocurrency }
      );
    } else {
      await qb.insert('balances', {
        user_id: userId,
        currency: cryptocurrency,
        total: amount,
        available: amount,
        locked: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    logger.info('Crypto balance credited', {
      userId,
      cryptocurrency,
      amount
    });
  }

  /**
   * Get deposit address for user
   */
  static async getDepositAddress(userId, cryptocurrency) {
    const addresses = await qb.select('crypto_deposit_addresses', {
      user_id: userId,
      cryptocurrency
    });

    if (addresses.length > 0) {
      return addresses[0];
    }

    // Generate new address if doesn't exist
    return await this.generateDepositAddress(userId, cryptocurrency);
  }

  /**
   * Get crypto deposit history
   */
  static async getDepositHistory(userId, cryptocurrency = null) {
    let conditions = { user_id: userId };
    if (cryptocurrency) {
      conditions.cryptocurrency = cryptocurrency;
    }

    return await qb.select('crypto_deposits', conditions);
  }
}

module.exports = CryptoDepositService;

