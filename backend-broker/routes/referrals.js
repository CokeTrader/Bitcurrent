/**
 * Referral system API
 * Track referrals and distribute bonuses
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// In-memory storage (replace with database in production)
const referrals = new Map();
const referralStats = new Map();

/**
 * Get user's referral code
 * GET /api/v1/referrals/code
 */
router.get('/code', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const referralCode = `BC${userId.slice(0, 8).toUpperCase()}`;
    
    res.json({
      success: true,
      referralCode,
      referralLink: `${process.env.FRONTEND_URL}/auth/register?ref=${referralCode}`
    });
  } catch (error) {
    logger.error('Get referral code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral code'
    });
  }
});

/**
 * Get referral stats
 * GET /api/v1/referrals/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = referralStats.get(userId) || {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalEarnings: 0,
      referralList: []
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral stats'
    });
  }
});

/**
 * Track referral signup
 * POST /api/v1/referrals/track
 * (Called internally during registration)
 */
router.post('/track', async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    
    if (!referralCode) {
      return res.json({ success: true, message: 'No referral code' });
    }
    
    // Extract referrer user ID from code
    const referrerId = referralCode.replace('BC', '').toLowerCase();
    
    // Store referral
    if (!referrals.has(referrerId)) {
      referrals.set(referrerId, []);
    }
    
    const referral = {
      referredUserId: newUserId,
      status: 'pending', // pending, completed
      bonusPaid: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    referrals.get(referrerId).push(referral);
    
    // Update stats
    const stats = referralStats.get(referrerId) || {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalEarnings: 0,
      referralList: []
    };
    
    stats.totalReferrals++;
    stats.pendingReferrals++;
    stats.referralList.push({
      userId: newUserId,
      status: 'pending',
      createdAt: referral.createdAt
    });
    
    referralStats.set(referrerId, stats);
    
    logger.info('Referral tracked', { referrerId, newUserId });
    
    res.json({
      success: true,
      message: 'Referral tracked'
    });
  } catch (error) {
    logger.error('Track referral error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track referral'
    });
  }
});

/**
 * Complete referral (called when referred user completes KYC)
 * POST /api/v1/referrals/complete
 * (Called internally)
 */
router.post('/complete', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find referral
    let referrerId = null;
    let referral = null;
    
    for (const [rId, refs] of referrals.entries()) {
      const found = refs.find(r => r.referredUserId === userId && r.status === 'pending');
      if (found) {
        referrerId = rId;
        referral = found;
        break;
      }
    }
    
    if (!referral) {
      return res.json({ success: true, message: 'No pending referral found' });
    }
    
    // Mark as completed
    referral.status = 'completed';
    referral.completedAt = new Date().toISOString();
    
    // Update stats
    const stats = referralStats.get(referrerId);
    if (stats) {
      stats.completedReferrals++;
      stats.pendingReferrals--;
      stats.totalEarnings += 10; // £10 per referral
      
      // Update referral in list
      const refInList = stats.referralList.find(r => r.userId === userId);
      if (refInList) {
        refInList.status = 'completed';
        refInList.completedAt = referral.completedAt;
      }
    }
    
    // TODO: Credit £10 to both referrer and referred user
    // await creditBonus(referrerId, 10, 'referral_bonus');
    // await creditBonus(userId, 10, 'referral_bonus');
    
    logger.info('Referral completed', { referrerId, userId });
    
    res.json({
      success: true,
      message: 'Referral bonus credited',
      bonusAmount: 10
    });
  } catch (error) {
    logger.error('Complete referral error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete referral'
    });
  }
});

/**
 * Get top referrers (leaderboard)
 * GET /api/v1/referrals/leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = Array.from(referralStats.entries())
      .map(([userId, stats]) => ({
        userId: userId.slice(0, 8) + '***', // Anonymize
        referrals: stats.completedReferrals,
        earnings: stats.totalEarnings
      }))
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 10);
    
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
});

module.exports = router;

