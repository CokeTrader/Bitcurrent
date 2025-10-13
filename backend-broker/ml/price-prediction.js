/**
 * Price Prediction Model
 * Machine learning for price forecasting
 */

const logger = require('../utils/logger');

class PricePredictionModel {
  /**
   * Predict next price movement
   * Uses simple moving average + momentum for demo
   * In production: Use TensorFlow.js or Python ML service
   */
  static async predictPrice(pair, historicalPrices) {
    try {
      // Simple prediction using technical indicators
      const sma20 = this.calculateSMA(historicalPrices, 20);
      const sma50 = this.calculateSMA(historicalPrices, 50);
      const rsi = this.calculateRSI(historicalPrices, 14);
      const momentum = this.calculateMomentum(historicalPrices, 10);

      const currentPrice = historicalPrices[historicalPrices.length - 1].price;

      // Prediction logic
      let prediction = 'neutral';
      let confidence = 50;
      let targetPrice = currentPrice;

      // Bullish signals
      if (sma20 > sma50 && rsi < 70 && momentum > 0) {
        prediction = 'bullish';
        confidence = 65 + (momentum * 10);
        targetPrice = currentPrice * 1.02; // 2% upside
      }
      // Bearish signals
      else if (sma20 < sma50 && rsi > 30 && momentum < 0) {
        prediction = 'bearish';
        confidence = 65 + (Math.abs(momentum) * 10);
        targetPrice = currentPrice * 0.98; // 2% downside
      }

      logger.info('Price prediction generated', {
        pair,
        prediction,
        confidence: Math.min(confidence, 95)
      });

      return {
        pair,
        currentPrice,
        prediction,
        targetPrice: parseFloat(targetPrice.toFixed(2)),
        confidence: Math.min(confidence, 95),
        timeframe: '24h',
        indicators: {
          sma20: parseFloat(sma20.toFixed(2)),
          sma50: parseFloat(sma50.toFixed(2)),
          rsi: parseFloat(rsi.toFixed(2)),
          momentum: parseFloat(momentum.toFixed(4))
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Price prediction failed', {
        pair,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate Simple Moving Average
   */
  static calculateSMA(prices, period) {
    const slice = prices.slice(-period);
    const sum = slice.reduce((acc, p) => acc + p.price, 0);
    return sum / period;
  }

  /**
   * Calculate Relative Strength Index
   */
  static calculateRSI(prices, period = 14) {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i].price - prices[i - 1].price);
    }

    const recentChanges = changes.slice(-period);
    const gains = recentChanges.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;

    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate Momentum
   */
  static calculateMomentum(prices, period = 10) {
    if (prices.length < period + 1) return 0;
    
    const current = prices[prices.length - 1].price;
    const past = prices[prices.length - period - 1].price;
    
    return (current - past) / past;
  }

  /**
   * Sentiment analysis from news/social media
   * In production: Use NLP API or train custom model
   */
  static async analyzeSentiment(pair) {
    // Mock sentiment score (-1 to +1)
    const sentiment = (Math.random() - 0.5) * 2;
    
    return {
      score: parseFloat(sentiment.toFixed(2)),
      label: sentiment > 0.3 ? 'positive' : sentiment < -0.3 ? 'negative' : 'neutral',
      sources: ['Twitter', 'Reddit', 'News'],
      timestamp: Date.now()
    };
  }

  /**
   * Get trading signals
   */
  static async generateSignals(pair, historicalPrices) {
    const prediction = await this.predictPrice(pair, historicalPrices);
    const sentiment = await this.analyzeSentiment(pair);

    const signals = [];

    // Strong buy signal
    if (prediction.prediction === 'bullish' && prediction.confidence > 70 && sentiment.score > 0.5) {
      signals.push({
        type: 'STRONG_BUY',
        confidence: Math.min((prediction.confidence + sentiment.score * 100) / 2, 95),
        reason: 'Bullish technical indicators + positive sentiment'
      });
    }

    // Buy signal
    else if (prediction.prediction === 'bullish' && prediction.confidence > 60) {
      signals.push({
        type: 'BUY',
        confidence: prediction.confidence,
        reason: 'Bullish technical indicators'
      });
    }

    // Strong sell signal
    else if (prediction.prediction === 'bearish' && prediction.confidence > 70 && sentiment.score < -0.5) {
      signals.push({
        type: 'STRONG_SELL',
        confidence: Math.min((prediction.confidence + Math.abs(sentiment.score) * 100) / 2, 95),
        reason: 'Bearish technical indicators + negative sentiment'
      });
    }

    // Sell signal
    else if (prediction.prediction === 'bearish' && prediction.confidence > 60) {
      signals.push({
        type: 'SELL',
        confidence: prediction.confidence,
        reason: 'Bearish technical indicators'
      });
    }

    // Hold
    else {
      signals.push({
        type: 'HOLD',
        confidence: 60,
        reason: 'Mixed signals or neutral market'
      });
    }

    return signals;
  }
}

module.exports = PricePredictionModel;

