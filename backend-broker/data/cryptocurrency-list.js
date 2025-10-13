/**
 * Comprehensive Cryptocurrency List
 * 50+ supported assets for trading
 */

const CRYPTOCURRENCIES = [
  // Top 10 by Market Cap
  { symbol: 'BTC', name: 'Bitcoin', category: 'Layer 1', marketCap: 1300000000000 },
  { symbol: 'ETH', name: 'Ethereum', category: 'Layer 1', marketCap: 430000000000 },
  { symbol: 'BNB', name: 'Binance Coin', category: 'Exchange', marketCap: 85000000000 },
  { symbol: 'SOL', name: 'Solana', category: 'Layer 1', marketCap: 65000000000 },
  { symbol: 'XRP', name: 'Ripple', category: 'Payment', marketCap: 30000000000 },
  { symbol: 'ADA', name: 'Cardano', category: 'Layer 1', marketCap: 18000000000 },
  { symbol: 'AVAX', name: 'Avalanche', category: 'Layer 1', marketCap: 13000000000 },
  { symbol: 'DOT', name: 'Polkadot', category: 'Layer 0', marketCap: 10000000000 },
  { symbol: 'MATIC', name: 'Polygon', category: 'Layer 2', marketCap: 8000000000 },
  { symbol: 'LINK', name: 'Chainlink', category: 'Oracle', marketCap: 8000000000 },

  // DeFi Tokens
  { symbol: 'UNI', name: 'Uniswap', category: 'DeFi', marketCap: 5000000000 },
  { symbol: 'AAVE', name: 'Aave', category: 'DeFi', marketCap: 2000000000 },
  { symbol: 'MKR', name: 'Maker', category: 'DeFi', marketCap: 1500000000 },
  { symbol: 'CRV', name: 'Curve', category: 'DeFi', marketCap: 800000000 },
  { symbol: 'COMP', name: 'Compound', category: 'DeFi', marketCap: 600000000 },

  // Layer 1s & Alt L1s
  { symbol: 'ATOM', name: 'Cosmos', category: 'Layer 0', marketCap: 3500000000 },
  { symbol: 'NEAR', name: 'NEAR Protocol', category: 'Layer 1', marketCap: 6000000000 },
  { symbol: 'ALGO', name: 'Algorand', category: 'Layer 1', marketCap: 2000000000 },
  { symbol: 'ICP', name: 'Internet Computer', category: 'Layer 1', marketCap: 5000000000 },
  { symbol: 'FIL', name: 'Filecoin', category: 'Storage', marketCap: 3000000000 },

  // Layer 2s
  { symbol: 'ARB', name: 'Arbitrum', category: 'Layer 2', marketCap: 7000000000 },
  { symbol: 'OP', name: 'Optimism', category: 'Layer 2', marketCap: 6000000000 },

  // Meme Coins (High Volume)
  { symbol: 'DOGE', name: 'Dogecoin', category: 'Meme', marketCap: 12000000000 },
  { symbol: 'SHIB', name: 'Shiba Inu', category: 'Meme', marketCap: 5000000000 },
  { symbol: 'PEPE', name: 'Pepe', category: 'Meme', marketCap: 3000000000 },

  // Stablecoins
  { symbol: 'USDT', name: 'Tether', category: 'Stablecoin', marketCap: 90000000000 },
  { symbol: 'USDC', name: 'USD Coin', category: 'Stablecoin', marketCap: 35000000000 },
  { symbol: 'DAI', name: 'Dai', category: 'Stablecoin', marketCap: 5000000000 },

  // Others
  { symbol: 'LTC', name: 'Litecoin', category: 'Payment', marketCap: 6000000000 },
  { symbol: 'BCH', name: 'Bitcoin Cash', category: 'Payment', marketCap: 5000000000 },
  { symbol: 'XLM', name: 'Stellar', category: 'Payment', marketCap: 3000000000 },
  { symbol: 'TRX', name: 'TRON', category: 'Layer 1', marketCap: 10000000000 },
  { symbol: 'ETC', name: 'Ethereum Classic', category: 'Layer 1', marketCap: 3000000000 },
  { symbol: 'XMR', name: 'Monero', category: 'Privacy', marketCap: 3000000000 },
  { symbol: 'VET', name: 'VeChain', category: 'Supply Chain', marketCap: 2000000000 },
  { symbol: 'HBAR', name: 'Hedera', category: 'Layer 1', marketCap: 2500000000 },
  { symbol: 'APT', name: 'Aptos', category: 'Layer 1', marketCap: 3500000000 },
  { symbol: 'SUI', name: 'Sui', category: 'Layer 1', marketCap: 4000000000 },
  { symbol: 'INJ', name: 'Injective', category: 'DeFi', marketCap: 2000000000 },
  { symbol: 'SEI', name: 'Sei', category: 'Layer 1', marketCap: 1500000000 },
  { symbol: 'TIA', name: 'Celestia', category: 'Modular', marketCap: 2500000000 },

  // Gaming & Metaverse
  { symbol: 'IMX', name: 'Immutable X', category: 'Gaming', marketCap: 2000000000 },
  { symbol: 'SAND', name: 'The Sandbox', category: 'Metaverse', marketCap: 1000000000 },
  { symbol: 'MANA', name: 'Decentraland', category: 'Metaverse', marketCap: 900000000 },
  { symbol: 'AXS', name: 'Axie Infinity', category: 'Gaming', marketCap: 800000000 },

  // AI & Emerging
  { symbol: 'FET', name: 'Fetch.ai', category: 'AI', marketCap: 1500000000 },
  { symbol: 'RNDR', name: 'Render', category: 'AI', marketCap: 2000000000 },
  { symbol: 'GRT', name: 'The Graph', category: 'Indexing', marketCap: 1800000000 },

  // Additional Popular
  { symbol: 'QNT', name: 'Quant', category: 'Interoperability', marketCap: 1500000000 }
];

/**
 * Get all supported cryptocurrencies
 */
function getAllCryptocurrencies() {
  return CRYPTOCURRENCIES;
}

/**
 * Get cryptocurrencies by category
 */
function getCryptocurrenciesByCategory(category) {
  return CRYPTOCURRENCIES.filter(c => c.category === category);
}

/**
 * Get trading pairs (all paired with USD)
 */
function getAllTradingPairs() {
  return CRYPTOCURRENCIES
    .filter(c => c.category !== 'Stablecoin') // Don't trade stablecoins
    .map(c => ({
      pair: `${c.symbol}/USD`,
      base: c.symbol,
      quote: 'USD',
      name: c.name,
      category: c.category
    }));
}

/**
 * Get categories
 */
function getCategories() {
  const categories = [...new Set(CRYPTOCURRENCIES.map(c => c.category))];
  return categories.map(cat => ({
    name: cat,
    count: CRYPTOCURRENCIES.filter(c => c.category === cat).length
  }));
}

module.exports = {
  CRYPTOCURRENCIES,
  getAllCryptocurrencies,
  getCryptocurrenciesByCategory,
  getAllTradingPairs,
  getCategories
};

