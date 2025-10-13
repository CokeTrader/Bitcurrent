/**
 * Staking API
 * Manage crypto staking positions and rewards
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// Staking pools configuration
const STAKING_POOLS = {
  'ETH': { apy: 4.5, minAmount: 0.01, lockPeriod: 0, risk: 'Low' },
  'SOL': { apy: 6.8, minAmount: 1, lockPeriod: 0, risk: 'Medium' },
  'ADA': { apy: 5.2, minAmount: 10, lockPeriod: 0, risk: 'Low' },
  'DOT': { apy: 12.5, minAmount: 1, lockPeriod: 28, risk: 'Medium' }
};

// In-memory storage (replace with database)
const stakingPositions = new Map();

/**
 * Get available staking pools
 * GET /api/v1/staking/pools
 */
router.get('/pools', async (req, res) => {
  try {
    const pools = Object.entries(STAKING_POOLS).map(([symbol, config]) => ({
      symbol,
      ...config,
      description: `Stake ${symbol} and earn ${config.apy}% APY`
    }));
    
    res.json({
      success: true,
      pools
    });
  } catch (error) {
    logger.error('Get staking pools error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staking pools'
    });
  }
});

/**
 * Get user's staking positions
 * GET /api/v1/staking/positions
 */
router.get('/positions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const positions = stakingPositions.get(userId) || [];
    
    // Calculate current rewards
    const positionsWithRewards = positions.map(pos => {
      if (pos.status !== 'active') return pos;
      
      const daysPassed = (Date.now() - new Date(pos.startDate).getTime()) / (1000 * 60 * 60 * 24);
      const rewards = (pos.amount * (pos.apy / 100) * daysPassed) / 365;
      
      return {
        ...pos,
        currentRewards: rewards,
        totalValue: pos.amount + rewards
      };
    });
    
    res.json({
      success: true,
      positions: positionsWithRewards
    });
  } catch (error) {
    logger.error('Get staking positions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staking positions'
    });
  }
});

/**
 * Stake crypto
 * POST /api/v1/staking/stake
 */
router.post('/stake', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, amount } = req.body;
    
    // Validation
    if (!symbol || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const pool = STAKING_POOLS[symbol];
    if (!pool) {
      return res.status(400).json({
        success: false,
        error: 'Invalid staking pool'
      });
    }
    
    const amountNum = parseFloat(amount);
    if (amountNum < pool.minAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum stake is ${pool.minAmount} ${symbol}`
      });
    }
    
    // TODO: Check user has sufficient balance
    // TODO: Lock the funds in user's balance
    
    // Create staking position
    const position = {
      id: `stake_${Date.now()}`,
      symbol,
      amount: amountNum,
      apy: pool.apy,
      lockPeriod: pool.lockPeriod,
      status: 'active',
      startDate: new Date().toISOString(),
      unlockDate: pool.lockPeriod > 0 
        ? new Date(Date.now() + pool.lockPeriod * 24 * 60 * 60 * 1000).toISOString()
        : null,
      totalRewards: 0
    };
    
    if (!stakingPositions.has(userId)) {
      stakingPositions.set(userId, []);
    }
    stakingPositions.get(userId).push(position);
    
    logger.info('Staking position created', { userId, symbol, amount: amountNum });
    
    res.json({
      success: true,
      position: {
        id: position.id,
        symbol: position.symbol,
        amount: position.amount,
        apy: position.apy,
        unlockDate: position.unlockDate
      },
      message: `Successfully staked ${amountNum} ${symbol}`
    });
  } catch (error) {
    logger.error('Stake error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create staking position'
    });
  }
});

/**
 * Unstake crypto
 * POST /api/v1/staking/unstake
 */
router.post('/unstake', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { positionId } = req.body;
    
    const positions = stakingPositions.get(userId) || [];
    const position = positions.find(p => p.id === positionId);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Staking position not found'
      });
    }
    
    if (position.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Position is not active'
      });
    }
    
    // Check if lock period has passed
    if (position.unlockDate && new Date() < new Date(position.unlockDate)) {
      return res.status(400).json({
        success: false,
        error: `Position is locked until ${position.unlockDate}`
      });
    }
    
    // Calculate final rewards
    const daysPassed = (Date.now() - new Date(position.startDate).getTime()) / (1000 * 60 * 60 * 24);
    const rewards = (position.amount * (position.apy / 100) * daysPassed) / 365;
    
    position.status = 'completed';
    position.endDate = new Date().toISOString();
    position.totalRewards = rewards;
    
    // TODO: Return funds + rewards to user balance
    // await creditBalance(userId, position.symbol, position.amount + rewards);
    
    logger.info('Unstaked', { userId, positionId, rewards });
    
    res.json({
      success: true,
      message: 'Unstaked successfully',
      position: {
        symbol: position.symbol,
        stakedAmount: position.amount,
        rewards: rewards,
        totalReturned: position.amount + rewards
      }
    });
  } catch (error) {
    logger.error('Unstake error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unstake'
    });
  }
});

/**
 * Claim staking rewards (without unstaking)
 * POST /api/v1/staking/claim-rewards
 */
router.post('/claim-rewards', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { positionId } = req.body;
    
    const positions = stakingPositions.get(userId) || [];
    const position = positions.find(p => p.id === positionId);
    
    if (!position || position.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Invalid staking position'
      });
    }
    
    // Calculate unclaimed rewards
    const daysPassed = (Date.now() - new Date(position.startDate).getTime()) / (1000 * 60 * 60 * 24);
    const rewards = (position.amount * (position.apy / 100) * daysPassed) / 365;
    const unclaimedRewards = rewards - position.totalRewards;
    
    if (unclaimedRewards <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No rewards to claim'
      });
    }
    
    // Claim rewards
    position.totalRewards += unclaimedRewards;
    position.lastClaimDate = new Date().toISOString();
    
    // TODO: Credit rewards to user balance
    // await creditBalance(userId, position.symbol, unclaimedRewards);
    
    logger.info('Staking rewards claimed', { userId, positionId, rewards: unclaimedRewards });
    
    res.json({
      success: true,
      rewards: unclaimedRewards,
      symbol: position.symbol,
      message: `Claimed ${unclaimedRewards.toFixed(8)} ${position.symbol}`
    });
  } catch (error) {
    logger.error('Claim rewards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim rewards'
    });
  }
});

module.exports = router;


