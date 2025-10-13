/**
 * Market News API Routes
 */

const express = require('express');
const router = express.Router();
const marketNewsService = require('../services/market-news-service');

/**
 * GET /api/v1/news
 * Get latest crypto news
 */
router.get('/', async (req, res) => {
  try {
    const { limit, category } = req.query;
    const result = await marketNewsService.getLatestNews(
      parseInt(limit) || 20,
      category
    );
    res.json(result);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve news'
    });
  }
});

/**
 * GET /api/v1/news/sentiment/:asset
 * Get market sentiment for asset
 */
router.get('/sentiment/:asset', async (req, res) => {
  try {
    const { asset } = req.params;
    const result = await marketNewsService.getMarketSentiment(asset);
    res.json(result);
  } catch (error) {
    console.error('Get sentiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sentiment'
    });
  }
});

/**
 * GET /api/v1/news/technical/:asset
 * Get technical analysis for asset
 */
router.get('/technical/:asset', async (req, res) => {
  try {
    const { asset } = req.params;
    const result = await marketNewsService.getTechnicalAnalysis(asset);
    res.json(result);
  } catch (error) {
    console.error('Get technical analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve technical analysis'
    });
  }
});

/**
 * GET /api/v1/news/trending
 * Get trending topics
 */
router.get('/trending', async (req, res) => {
  try {
    const result = await marketNewsService.getTrendingTopics();
    res.json(result);
  } catch (error) {
    console.error('Get trending topics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trending topics'
    });
  }
});

module.exports = router;

