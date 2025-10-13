/**
 * Liquidity Provider / Market Making Service
 * Automated market making for improved liquidity
 */

const logger = require('../utils/logger');

class LiquidityProvider {
  constructor() {
    this.positions = new Map();
    this.inventory = {};
    this.targetSpread = 0.002; // 0.2% spread
    this.maxInventory = 10; // Max position in BTC equivalent
  }

  /**
   * Provide two-sided quotes
   */
  async quoteMarket(pair, currentPrice) {
    const bidPrice = currentPrice * (1 - this.targetSpread / 2);
    const askPrice = currentPrice * (1 + this.targetSpread / 2);
    const size = this.calculateQuoteSize(pair);

    return {
      pair,
      bid: { price: bidPrice.toFixed(2), size },
      ask: { price: askPrice.toFixed(2), size },
      spread: this.targetSpread * 100 + '%',
      timestamp: Date.now()
    };
  }

  /**
   * Calculate quote size based on inventory
   */
  calculateQuoteSize(pair) {
    const currentInventory = this.inventory[pair] || 0;
    const inventoryRatio = Math.abs(currentInventory) / this.maxInventory;
    
    // Reduce size as inventory increases
    const baseSize = 0.1;
    return baseSize * (1 - inventoryRatio);
  }

  /**
   * Track P&L from market making
   */
  calculatePnL() {
    let totalPnL = 0;
    
    for (const [pair, inventory] of Object.entries(this.inventory)) {
      // Calculate unrealized P&L
      const currentPrice = 67000; // Mock
      const pnl = inventory * currentPrice;
      totalPnL += pnl;
    }

    return totalPnL;
  }
}

module.exports = new LiquidityProvider();

