/**
 * Backtesting Engine
 * Test trading strategies against historical data
 */

const logger = require('../utils/logger');

class BacktestingEngine {
  /**
   * Run backtest for strategy
   */
  static async runBacktest(strategy, historicalData, config = {}) {
    const {
      initialBalance = 10000,
      feePercent = 0.0025,
      slippagePercent = 0.001
    } = config;

    const results = {
      trades: [],
      balance: initialBalance,
      equity: initialBalance,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    };

    let position = null;
    let peakEquity = initialBalance;

    // Simulate trading through historical data
    for (let i = 20; i < historicalData.length; i++) {
      const candle = historicalData[i];
      const signal = strategy.getSignal(historicalData.slice(i - 20, i));

      // Open position on buy signal
      if (signal === 'BUY' && !position) {
        const entryPrice = candle.close * (1 + slippagePercent);
        const qty = (results.balance * 0.95) / entryPrice; // 95% of balance
        const fee = qty * entryPrice * feePercent;

        position = {
          side: 'long',
          entryPrice,
          qty,
          entryTime: candle.timestamp
        };

        results.balance -= (qty * entryPrice + fee);

        logger.debug('Backtest: Position opened', {
          price: entryPrice,
          qty,
          fee
        });
      }

      // Close position on sell signal
      else if (signal === 'SELL' && position) {
        const exitPrice = candle.close * (1 - slippagePercent);
        const qty = position.qty;
        const fee = qty * exitPrice * feePercent;
        const pnl = (exitPrice - position.entryPrice) * qty - fee;

        results.balance += qty * exitPrice - fee;
        results.equity = results.balance;

        // Record trade
        results.trades.push({
          entry: position.entryPrice,
          exit: exitPrice,
          qty,
          pnl,
          return: (pnl / (position.qty * position.entryPrice)) * 100,
          holdTime: candle.timestamp - position.entryTime
        });

        results.totalTrades++;
        if (pnl > 0) results.winningTrades++;
        else results.losingTrades++;

        // Update drawdown
        if (results.equity > peakEquity) {
          peakEquity = results.equity;
        }
        const drawdown = ((peakEquity - results.equity) / peakEquity) * 100;
        if (drawdown > results.maxDrawdown) {
          results.maxDrawdown = drawdown;
        }

        position = null;

        logger.debug('Backtest: Position closed', {
          exitPrice,
          pnl,
          return: ((pnl / (qty * position.entryPrice)) * 100).toFixed(2) + '%'
        });
      }
    }

    // Close any open position at end
    if (position) {
      const exitPrice = historicalData[historicalData.length - 1].close;
      const pnl = (exitPrice - position.entryPrice) * position.qty;
      results.balance += position.qty * exitPrice;
      results.equity = results.balance;
    }

    // Calculate metrics
    results.winRate = results.totalTrades > 0 
      ? (results.winningTrades / results.totalTrades) * 100 
      : 0;

    const totalWins = results.trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(results.trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    results.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins;

    const returns = results.trades.map(t => t.return);
    results.sharpeRatio = this.calculateSharpeRatio(returns);

    results.totalReturn = ((results.equity - initialBalance) / initialBalance) * 100;

    logger.info('Backtest completed', {
      totalTrades: results.totalTrades,
      winRate: results.winRate.toFixed(2) + '%',
      totalReturn: results.totalReturn.toFixed(2) + '%',
      maxDrawdown: results.maxDrawdown.toFixed(2) + '%'
    });

    return results;
  }

  /**
   * Calculate Sharpe Ratio
   */
  static calculateSharpeRatio(returns) {
    if (returns.length === 0) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev > 0 ? avgReturn / stdDev : 0;
  }
}

module.exports = BacktestingEngine;

