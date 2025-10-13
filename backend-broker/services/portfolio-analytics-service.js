/**
 * Advanced Portfolio Analytics Service
 * 
 * Comprehensive portfolio insights:
 * - Performance metrics (daily, weekly, monthly, all-time)
 * - Asset allocation breakdown
 * - Historical performance charts
 * - Risk metrics (volatility, Sharpe ratio)
 * - Profit/Loss distribution
 * - Trade success rate
 * - Best/worst performers
 */

const pool = require('../config/database');
const multiAssetService = require('./multi-asset-trading-service');

class PortfolioAnalyticsService {
  
  /**
   * Get comprehensive portfolio analytics
   */
  async getPortfolioAnalytics(userId, timeframe = '30d') {
    try {
      const [
        performance,
        allocation,
        topPerformers,
        tradeStats,
        riskMetrics,
        historicalValue
      ] = await Promise.all([
        this.getPerformanceMetrics(userId, timeframe),
        this.getAssetAllocation(userId),
        this.getTopPerformers(userId),
        this.getTradeStatistics(userId),
        this.getRiskMetrics(userId),
        this.getHistoricalValue(userId, timeframe)
      ]);

      return {
        success: true,
        analytics: {
          performance,
          allocation,
          topPerformers,
          tradeStats,
          riskMetrics,
          historicalValue,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Get portfolio analytics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(userId, timeframe) {
    try {
      const portfolio = await multiAssetService.getMultiAssetPortfolio(userId);
      
      if (!portfolio.success) {
        return null;
      }

      const { totalValueInGBP, pnl } = portfolio.portfolio;

      // Calculate time-based metrics
      const timeframes = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
        'all': 9999
      };

      const days = timeframes[timeframe] || 30;

      // Get historical trades for the period
      const tradesResult = await pool.query(
        `SELECT 
          SUM(CASE WHEN side = 'buy' THEN total ELSE 0 END) as invested,
          SUM(CASE WHEN side = 'sell' THEN total ELSE 0 END) as returned,
          COUNT(*) as trade_count
         FROM trades
         WHERE user_id = $1 
         AND created_at >= NOW() - INTERVAL '${days} days'`,
        [userId]
      );

      const periodData = tradesResult.rows[0];
      const invested = parseFloat(periodData.invested || 0);
      const returned = parseFloat(periodData.returned || 0);

      return {
        totalValue: totalValueInGBP,
        totalPnL: pnl.total,
        totalPnLPercentage: pnl.percentage,
        realizedPnL: pnl.realized,
        unrealizedPnL: pnl.unrealized,
        periodInvested: invested,
        periodReturned: returned,
        periodPnL: returned - invested,
        periodPnLPercentage: invested > 0 ? ((returned - invested) / invested * 100).toFixed(2) + '%' : '0%',
        tradeCount: parseInt(periodData.trade_count || 0)
      };

    } catch (error) {
      console.error('Get performance metrics error:', error);
      return null;
    }
  }

  /**
   * Get asset allocation breakdown
   */
  async getAssetAllocation(userId) {
    try {
      const portfolio = await multiAssetService.getMultiAssetPortfolio(userId);
      
      if (!portfolio.success) {
        return [];
      }

      const { assets, totalValueInGBP, gbp } = portfolio.portfolio;
      
      const allocation = [];

      // Add GBP
      if (gbp > 0) {
        allocation.push({
          asset: 'GBP',
          balance: gbp,
          value: gbp,
          percentage: ((gbp / totalValueInGBP) * 100).toFixed(2),
          color: '#10B981' // green
        });
      }

      // Add crypto assets
      const colors = {
        BTC: '#F7931A', // orange
        ETH: '#627EEA', // blue
        SOL: '#14F195', // teal
        ADA: '#0033AD', // dark blue
        DOT: '#E6007A', // pink
        LTC: '#345D9D', // light blue
        XRP: '#23292F'  // dark gray
      };

      for (const [symbol, data] of Object.entries(assets)) {
        if (data.balance > 0) {
          allocation.push({
            asset: symbol,
            balance: data.balance,
            value: data.value,
            price: data.price,
            percentage: ((data.value / totalValueInGBP) * 100).toFixed(2),
            color: colors[symbol] || '#6B7280'
          });
        }
      }

      // Sort by value descending
      allocation.sort((a, b) => b.value - a.value);

      return allocation;

    } catch (error) {
      console.error('Get asset allocation error:', error);
      return [];
    }
  }

  /**
   * Get top performing assets
   */
  async getTopPerformers(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          symbol,
          COUNT(*) as trade_count,
          SUM(CASE WHEN side = 'buy' THEN total ELSE 0 END) as total_bought,
          SUM(CASE WHEN side = 'sell' THEN total ELSE 0 END) as total_sold,
          SUM(pnl) as total_pnl,
          AVG(CASE WHEN side = 'buy' THEN price END) as avg_buy_price,
          AVG(CASE WHEN side = 'sell' THEN price END) as avg_sell_price
         FROM trades
         WHERE user_id = $1
         GROUP BY symbol
         ORDER BY total_pnl DESC
         LIMIT 10`,
        [userId]
      );

      return result.rows.map(row => ({
        symbol: row.symbol,
        tradeCount: parseInt(row.trade_count),
        totalBought: parseFloat(row.total_bought || 0),
        totalSold: parseFloat(row.total_sold || 0),
        totalPnL: parseFloat(row.total_pnl || 0),
        avgBuyPrice: parseFloat(row.avg_buy_price || 0),
        avgSellPrice: parseFloat(row.avg_sell_price || 0),
        roi: row.total_bought > 0 
          ? ((parseFloat(row.total_pnl || 0) / parseFloat(row.total_bought)) * 100).toFixed(2) + '%'
          : '0%'
      }));

    } catch (error) {
      console.error('Get top performers error:', error);
      return [];
    }
  }

  /**
   * Get trade statistics
   */
  async getTradeStatistics(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_trades,
          COUNT(CASE WHEN side = 'buy' THEN 1 END) as buy_count,
          COUNT(CASE WHEN side = 'sell' THEN 1 END) as sell_count,
          COUNT(CASE WHEN pnl > 0 THEN 1 END) as profitable_trades,
          COUNT(CASE WHEN pnl < 0 THEN 1 END) as losing_trades,
          AVG(CASE WHEN pnl > 0 THEN pnl END) as avg_win,
          AVG(CASE WHEN pnl < 0 THEN pnl END) as avg_loss,
          MAX(pnl) as best_trade,
          MIN(pnl) as worst_trade,
          SUM(total) as total_volume
         FROM trades
         WHERE user_id = $1`,
        [userId]
      );

      const stats = result.rows[0];
      const totalTrades = parseInt(stats.total_trades || 0);
      const profitableTrades = parseInt(stats.profitable_trades || 0);
      const losingTrades = parseInt(stats.losing_trades || 0);

      return {
        totalTrades,
        buyCount: parseInt(stats.buy_count || 0),
        sellCount: parseInt(stats.sell_count || 0),
        profitableTrades,
        losingTrades,
        winRate: totalTrades > 0 
          ? ((profitableTrades / totalTrades) * 100).toFixed(2) + '%'
          : '0%',
        avgWin: parseFloat(stats.avg_win || 0),
        avgLoss: parseFloat(stats.avg_loss || 0),
        bestTrade: parseFloat(stats.best_trade || 0),
        worstTrade: parseFloat(stats.worst_trade || 0),
        totalVolume: parseFloat(stats.total_volume || 0),
        profitFactor: stats.avg_loss < 0 && stats.avg_win > 0
          ? (stats.avg_win / Math.abs(stats.avg_loss)).toFixed(2)
          : 'N/A'
      };

    } catch (error) {
      console.error('Get trade statistics error:', error);
      return null;
    }
  }

  /**
   * Get risk metrics
   */
  async getRiskMetrics(userId) {
    try {
      // Get daily PnL for volatility calculation
      const result = await pool.query(
        `SELECT 
          DATE(created_at) as trade_date,
          SUM(pnl) as daily_pnl
         FROM trades
         WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '90 days'
         GROUP BY DATE(created_at)
         ORDER BY trade_date`,
        [userId]
      );

      const dailyPnLs = result.rows.map(row => parseFloat(row.daily_pnl || 0));
      
      if (dailyPnLs.length === 0) {
        return {
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          riskScore: 'Low'
        };
      }

      // Calculate volatility (standard deviation)
      const mean = dailyPnLs.reduce((a, b) => a + b, 0) / dailyPnLs.length;
      const variance = dailyPnLs.reduce((sum, pnl) => sum + Math.pow(pnl - mean, 2), 0) / dailyPnLs.length;
      const volatility = Math.sqrt(variance);

      // Calculate Sharpe ratio (assuming 0% risk-free rate)
      const sharpeRatio = volatility > 0 ? (mean / volatility).toFixed(2) : 0;

      // Calculate max drawdown
      let peak = dailyPnLs[0];
      let maxDrawdown = 0;
      
      for (const pnl of dailyPnLs) {
        if (pnl > peak) peak = pnl;
        const drawdown = ((peak - pnl) / peak) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      // Risk score
      let riskScore = 'Low';
      if (volatility > 100) riskScore = 'High';
      else if (volatility > 50) riskScore = 'Medium';

      return {
        volatility: volatility.toFixed(2),
        sharpeRatio: parseFloat(sharpeRatio),
        maxDrawdown: maxDrawdown.toFixed(2) + '%',
        riskScore,
        dailyAvgReturn: mean.toFixed(2)
      };

    } catch (error) {
      console.error('Get risk metrics error:', error);
      return null;
    }
  }

  /**
   * Get historical portfolio value
   */
  async getHistoricalValue(userId, timeframe) {
    try {
      const timeframes = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
        'all': 9999
      };

      const days = timeframes[timeframe] || 30;

      const result = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          SUM(CASE WHEN side = 'buy' THEN -total ELSE total END) as net_flow,
          SUM(pnl) as daily_pnl
         FROM trades
         WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY DATE(created_at)
         ORDER BY date`,
        [userId]
      );

      // Calculate cumulative portfolio value
      let cumulativeValue = 0;
      const historicalData = result.rows.map(row => {
        cumulativeValue += parseFloat(row.net_flow || 0) + parseFloat(row.daily_pnl || 0);
        
        return {
          date: row.date,
          value: cumulativeValue.toFixed(2),
          pnl: parseFloat(row.daily_pnl || 0).toFixed(2)
        };
      });

      return historicalData;

    } catch (error) {
      console.error('Get historical value error:', error);
      return [];
    }
  }

  /**
   * Get asset comparison data
   */
  async getAssetComparison(userId, assets = ['BTC', 'ETH', 'SOL']) {
    try {
      const comparison = [];

      for (const asset of assets) {
        const result = await pool.query(
          `SELECT 
            COUNT(*) as trade_count,
            SUM(CASE WHEN side = 'buy' THEN total ELSE 0 END) as invested,
            SUM(pnl) as total_pnl,
            AVG(CASE WHEN side = 'buy' THEN price END) as avg_entry,
            MAX(CASE WHEN side = 'sell' THEN price END) as peak_exit
           FROM trades
           WHERE user_id = $1 AND symbol LIKE $2`,
          [userId, `${asset}-%`]
        );

        const data = result.rows[0];
        
        comparison.push({
          asset,
          tradeCount: parseInt(data.trade_count || 0),
          invested: parseFloat(data.invested || 0),
          totalPnL: parseFloat(data.total_pnl || 0),
          avgEntry: parseFloat(data.avg_entry || 0),
          peakExit: parseFloat(data.peak_exit || 0),
          roi: data.invested > 0 
            ? ((parseFloat(data.total_pnl || 0) / parseFloat(data.invested)) * 100).toFixed(2) + '%'
            : '0%'
        });
      }

      return {
        success: true,
        comparison
      };

    } catch (error) {
      console.error('Get asset comparison error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(userId, format = 'json') {
    try {
      const analytics = await this.getPortfolioAnalytics(userId, 'all');
      
      if (!analytics.success) {
        return analytics;
      }

      if (format === 'csv') {
        return this.convertToCSV(analytics.analytics);
      }

      return {
        success: true,
        report: analytics.analytics,
        format
      };

    } catch (error) {
      console.error('Generate performance report error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert analytics to CSV format
   */
  convertToCSV(analytics) {
    const lines = [];
    
    // Header
    lines.push('BitCurrent Portfolio Performance Report');
    lines.push(`Generated: ${analytics.generatedAt}`);
    lines.push('');
    
    // Performance section
    lines.push('PERFORMANCE METRICS');
    lines.push(`Total Value,${analytics.performance.totalValue}`);
    lines.push(`Total PnL,${analytics.performance.totalPnL}`);
    lines.push(`PnL Percentage,${analytics.performance.totalPnLPercentage}`);
    lines.push(`Realized PnL,${analytics.performance.realizedPnL}`);
    lines.push(`Unrealized PnL,${analytics.performance.unrealizedPnL}`);
    lines.push('');
    
    // Trade stats
    lines.push('TRADE STATISTICS');
    lines.push(`Total Trades,${analytics.tradeStats.totalTrades}`);
    lines.push(`Win Rate,${analytics.tradeStats.winRate}`);
    lines.push(`Best Trade,${analytics.tradeStats.bestTrade}`);
    lines.push(`Worst Trade,${analytics.tradeStats.worstTrade}`);
    lines.push('');
    
    // Allocation
    lines.push('ASSET ALLOCATION');
    lines.push('Asset,Balance,Value,Percentage');
    analytics.allocation.forEach(item => {
      lines.push(`${item.asset},${item.balance},${item.value},${item.percentage}%`);
    });

    return {
      success: true,
      csv: lines.join('\n'),
      filename: `bitcurrent_report_${Date.now()}.csv`
    };
  }
}

module.exports = new PortfolioAnalyticsService();

