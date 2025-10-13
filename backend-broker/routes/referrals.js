/**
 * Referral & Rewards API Routes
 */

const express = require('express');
const router = express.Router();
const referralService = require('../services/referral-service');
const { authenticateToken } = require('../middleware/api-auth');

router.use(authenticateToken);

/**
 * POST /api/v1/referrals/create-code
 * Create referral code
 */
router.post('/create-code', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await referralService.createReferralCode(userId);
    res.json(result);
  } catch (error) {
    console.error('Create referral code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create referral code'
    });
  }
});

/**
 * GET /api/v1/referrals/stats
 * Get user's referral stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await referralService.getReferralStats(userId);
    res.json(result);
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve referral stats'
    });
  }
});

/**
 * GET /api/v1/referrals/leaderboard
 * Get referral leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await referralService.getReferralLeaderboard(
      parseInt(limit) || 100
    );
    res.json(result);
  } catch (error) {
    console.error('Get referral leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve leaderboard'
    });
  }
});

module.exports = router;
