/**
 * Cryptocurrency helper utilities
 * Price conversions, formatting, calculations
 */

/**
 * Convert between currencies
 */
function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to base currency (GBP) first
  const gbpAmount = fromCurrency === 'GBP' 
    ? amount 
    : amount / (rates[fromCurrency] || 1);
  
  // Convert from GBP to target currency
  return toCurrency === 'GBP'
    ? gbpAmount
    : gbpAmount * (rates[toCurrency] || 1);
}

/**
 * Format cryptocurrency amount
 */
function formatCryptoAmount(amount, symbol) {
  const decimals = {
    'BTC': 8,
    'ETH': 6,
    'SOL': 4,
    'XRP': 2,
    'ADA': 2,
    'DOGE': 0
  };
  
  return parseFloat(amount).toFixed(decimals[symbol] || 8);
}

/**
 * Format GBP amount
 */
function formatGBP(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Calculate trading fee
 */
function calculateFee(amount, feePercent = 0.25) {
  return amount * (feePercent / 100);
}

/**
 * Calculate total with fee
 */
function calculateTotal(amount, side, feePercent = 0.25) {
  const fee = calculateFee(amount, feePercent);
  return side === 'buy' ? amount + fee : amount - fee;
}

/**
 * Calculate profit/loss
 */
function calculatePnL(buyPrice, sellPrice, quantity) {
  return (sellPrice - buyPrice) * quantity;
}

/**
 * Calculate percentage change
 */
function calculatePercentChange(oldValue, newValue) {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Validate crypto address format
 */
function isValidCryptoAddress(address, symbol) {
  const patterns = {
    'BTC': /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    'ETH': /^0x[a-fA-F0-9]{40}$/,
    'SOL': /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    'XRP': /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/
  };
  
  const pattern = patterns[symbol];
  return pattern ? pattern.test(address) : false;
}

/**
 * Get symbol info
 */
function getSymbolInfo(symbol) {
  const info = {
    'BTC': { name: 'Bitcoin', decimals: 8, minOrder: 0.0001 },
    'ETH': { name: 'Ethereum', decimals: 6, minOrder: 0.001 },
    'SOL': { name: 'Solana', decimals: 4, minOrder: 0.1 },
    'XRP': { name: 'XRP', decimals: 2, minOrder: 10 },
    'ADA': { name: 'Cardano', decimals: 2, minOrder: 10 },
    'DOGE': { name: 'Dogecoin', decimals: 0, minOrder: 100 },
    'DOT': { name: 'Polkadot', decimals: 4, minOrder: 1 },
    'AVAX': { name: 'Avalanche', decimals: 4, minOrder: 0.1 }
  };
  
  return info[symbol] || { name: symbol, decimals: 8, minOrder: 0.0001 };
}

/**
 * Parse trading pair
 */
function parseTradingPair(pair) {
  const [base, quote] = pair.split('-');
  return { base, quote, pair };
}

/**
 * Calculate position size for risk management
 */
function calculatePositionSize(accountBalance, riskPercent, entryPrice, stopLossPrice) {
  const riskAmount = accountBalance * (riskPercent / 100);
  const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
  return riskAmount / riskPerUnit;
}

/**
 * Calculate stop loss price
 */
function calculateStopLoss(entryPrice, stopLossPercent, side) {
  if (side === 'buy') {
    return entryPrice * (1 - stopLossPercent / 100);
  } else {
    return entryPrice * (1 + stopLossPercent / 100);
  }
}

/**
 * Calculate take profit price
 */
function calculateTakeProfit(entryPrice, takeProfitPercent, side) {
  if (side === 'buy') {
    return entryPrice * (1 + takeProfitPercent / 100);
  } else {
    return entryPrice * (1 - takeProfitPercent / 100);
  }
}

module.exports = {
  convertCurrency,
  formatCryptoAmount,
  formatGBP,
  calculateFee,
  calculateTotal,
  calculatePnL,
  calculatePercentChange,
  isValidCryptoAddress,
  getSymbolInfo,
  parseTradingPair,
  calculatePositionSize,
  calculateStopLoss,
  calculateTakeProfit
};

