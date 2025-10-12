// Paper Trading Service
// Simulates real trades without actually executing them on exchanges

const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Paper trading uses simulated order execution
 * - Orders are filled instantly at current market price
 * - No actual exchange API calls
 * - Balances are updated in paper_trading_accounts table
 * - Order history is stored normally for tracking
 */

class PaperTradingService {
  /**
   * Get current market price for a symbol
   * In production, this would call a real price feed API
   * For now, we'll use approximate prices
   */
  async getCurrentPrice(symbol) {
    // Parse symbol (e.g., "BTC-GBP" -> base: BTC, quote: GBP)
    const [base, quote] = symbol.split('-');
    
    // Approximate current prices in GBP (as of Oct 2025)
    const prices = {
      'BTC': 53000,  // Bitcoin
      'ETH': 1900,   // Ethereum
      'SOL': 110,    // Solana
      'ADA': 0.32,   // Cardano
      'XRP': 0.45,   // Ripple
      'BNB': 410,    // Binance Coin
      'DOGE': 0.08,  // Dogecoin
      'DOT': 5.20,   // Polkadot
      'AVAX': 28,    // Avalanche
      'MATIC': 0.58, // Polygon
    };
    
    return prices[base] || 1000; // Default fallback
  }

  /**
   * Execute a paper trade (simulated)
   */
  async executePaperTrade(userId, paperAccountId, symbol, side, amount) {
    const price = await this.getCurrentPrice(symbol);
    const [base, quote] = symbol.split('-');
    
    // Calculate amounts
    let baseAmount, quoteAmount, fee;
    
    if (side === 'BUY') {
      // amount is in quote currency (GBP)
      quoteAmount = parseFloat(amount);
      fee = quoteAmount * 0.001; // 0.1% fee
      baseAmount = (quoteAmount - fee) / price; // Amount of crypto bought
    } else {
      // amount is in base currency (crypto)
      baseAmount = parseFloat(amount);
      quoteAmount = baseAmount * price;
      fee = quoteAmount * 0.001; // 0.1% fee in GBP
    }
    
    return {
      success: true,
      filled: true,
      price,
      baseAmount,
      quoteAmount,
      fee,
      feeAmount: fee,
      feeCurrency: quote,
      status: 'FILLED'
    };
  }

  /**
   * Update paper account balance after trade
   */
  async updatePaperAccountBalance(paperAccountId, amountChange) {
    await query(
      `UPDATE paper_trading_accounts 
       SET current_balance = current_balance + $1
       WHERE id = $2`,
      [amountChange, paperAccountId]
    );
  }
}

module.exports = new PaperTradingService();

