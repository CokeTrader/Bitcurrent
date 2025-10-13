/**
 * Staking API Routes
 */

const express = require('express');
const router = express.Router();
const stakingService = require('../services/staking-service');
const { authenticateToken } = require('../middleware/api-auth');

router.use(authenticateToken);

/**
 * GET /api/v1/staking/options
 * Get available staking options
 */
router.get('/options', async (req, res) => {
  try {
    const result = stakingService.getStakingOptions();
    res.json(result);
  } catch (error) {
    console.error('Get staking options error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staking options'
    });
  }
});

/**
 * POST /api/v1/staking/stake
 * Create staking position
 */
router.post('/stake', async (req, res) => {
  try {
    const userId = req.user.id;
    const { asset, amount, term, autoCompound } = req.body;

    if (!asset || !amount) {
      return res.status(400).json({
        success: false,
        error: 'asset and amount required'
      });
    }

    const result = await stakingService.createStake(
      userId,
      asset,
      amount,
      term || 'flexible',
      autoCompound || false
    );

    res.json(result);
  } catch (error) {
    console.error('Create stake error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create staking position'
    });
  }
});

/**
 * POST /api/v1/staking/unstake/:positionId
 * Unstake position
 */
router.post('/unstake/:positionId', async (req, res) => {
  try {
    const userId = req.user.id;
    const positionId = parseInt(req.params.positionId);

    const result = await stakingService.unstake(userId, positionId);
    res.json(result);
  } catch (error) {
    console.error('Unstake error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unstake'
    });
  }
});

/**
 * GET /api/v1/staking/positions
 * Get user's staking positions
 */
router.get('/positions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const result = await stakingService.getUserStakingPositions(
      userId,
      status || 'active'
    );

    res.json(result);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve staking positions'
    });
  }
});

/**
 * POST /api/v1/staking/calculate
 * Calculate projected rewards
 */
router.post('/calculate', async (req, res) => {
  try {
    const { asset, amount, term, days } = req.body;

    if (!asset || !amount || !term) {
      return res.status(400).json({
        success: false,
        error: 'asset, amount, and term required'
      });
    }

    const result = stakingService.calculateProjectedRewards(
      asset,
      amount,
      term,
      days
    );

    res.json(result);
  } catch (error) {
    console.error('Calculate rewards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate rewards'
    });
  }
});

module.exports = router;
