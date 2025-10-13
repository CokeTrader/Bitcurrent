/**
 * Staking Service
 * 
 * Allow users to earn passive income by staking crypto:
 * - Lock assets for fixed period
 * - Earn APY rewards
 * - Flexible and fixed terms
 * - Auto-compounding options
 * 
 * MAJOR REVENUE STREAM!
 */

const pool = require('../config/database');

class StakingService {
  constructor() {
    // Staking APY rates by asset and term
    this.stakingRates = {
      BTC: {
        flexible: 2.5,   // 2.5% APY
        '30d': 4.0,      // 4% APY for 30-day lock
        '90d': 6.0,      // 6% APY for 90-day lock
        '180d': 8.0,     // 8% APY for 180-day lock
        '365d': 10.0     // 10% APY for 1-year lock
      },
      ETH: {
        flexible: 3.0,
        '30d': 5.0,
        '90d': 7.0,
        '180d': 9.0,
        '365d': 12.0
      },
      SOL: {
        flexible: 4.0,
        '30d': 6.0,
        '90d': 8.0,
        '180d': 10.0,
        '365d': 14.0
      },
      ADA: {
        flexible: 3.5,
        '30d': 5.5,
        '90d': 7.5,
        '180d': 9.5,
        '365d': 13.0
      },
      DOT: {
        flexible: 5.0,
        '30d': 7.0,
        '90d': 9.0,
        '180d': 12.0,
        '365d': 16.0
      }
    };
  }

  /**
   * Create staking position
   */
  async createStake(userId, asset, amount, term = 'flexible', autoCompound = false) {
    try {
      // Validate asset and term
      if (!this.stakingRates[asset]) {
        return {
          success: false,
          error: `Staking not available for ${asset}`
        };
      }

      if (!this.stakingRates[asset][term]) {
        return {
          success: false,
          error: `Invalid term: ${term}`
        };
      }

      // Check user has sufficient balance
      const balanceKey = `${asset.toLowerCase()}_balance`;
      const userResult = await pool.query(
        `SELECT ${balanceKey} FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const currentBalance = parseFloat(userResult.rows[0][balanceKey] || 0);
      
      if (currentBalance < amount) {
        return {
          success: false,
          error: `Insufficient ${asset} balance. Have: ${currentBalance}, Need: ${amount}`
        };
      }

      // Calculate maturity date
      let maturityDate = null;
      if (term !== 'flexible') {
        const days = parseInt(term.replace('d', ''));
        maturityDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }

      // Get APY rate
      const apyRate = this.stakingRates[asset][term];

      // Create staking position
      const result = await pool.query(
        `INSERT INTO staking_positions (
          user_id, asset, amount, term, apy_rate, auto_compound, 
          status, started_at, matures_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), $7, NOW())
        RETURNING *`,
        [userId, asset, amount, term, apyRate, autoCompound, maturityDate]
      );

      // Deduct from user's tradeable balance
      await pool.query(
        `UPDATE users SET ${balanceKey} = ${balanceKey} - $1 WHERE id = $2`,
        [amount, userId]
      );

      return {
        success: true,
        position: result.rows[0],
        message: `Successfully staked ${amount} ${asset} at ${apyRate}% APY`,
        estimatedAnnualRewards: (amount * apyRate / 100).toFixed(8)
      };

    } catch (error) {
      console.error('Create stake error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unstake position (withdraw staked assets + rewards)
   */
  async unstake(userId, positionId) {
    try {
      // Get staking position
      const positionResult = await pool.query(
        `SELECT * FROM staking_positions 
         WHERE id = $1 AND user_id = $2 AND status = 'active'`,
        [positionId, userId]
      );

      if (positionResult.rows.length === 0) {
        return {
          success: false,
          error: 'Staking position not found or already unstaked'
        };
      }

      const position = positionResult.rows[0];

      // Check if early withdrawal (penalty for fixed terms)
      const now = new Date();
      let penalty = 0;

      if (position.term !== 'flexible' && position.matures_at && now < new Date(position.matures_at)) {
        // Early withdrawal penalty: 50% of earned rewards
        penalty = 0.5;
      }

      // Calculate earned rewards
      const daysStaked = (now - new Date(position.started_at)) / (1000 * 60 * 60 * 24);
      const dailyRate = position.apy_rate / 365 / 100;
      const grossRewards = position.amount * dailyRate * daysStaked;
      const netRewards = grossRewards * (1 - penalty);

      // Calculate total to return
      const totalAmount = position.amount + netRewards;

      // Return to user's balance
      const balanceKey = `${position.asset.toLowerCase()}_balance`;
      await pool.query(
        `UPDATE users SET ${balanceKey} = ${balanceKey} + $1 WHERE id = $2`,
        [totalAmount, userId]
      );

      // Update position status
      await pool.query(
        `UPDATE staking_positions 
         SET status = 'completed', completed_at = NOW(), 
             rewards_earned = $1, penalty_applied = $2
         WHERE id = $3`,
        [netRewards, penalty * grossRewards, positionId]
      );

      return {
        success: true,
        message: `Successfully unstaked ${position.amount} ${position.asset}`,
        principal: position.amount,
        rewards: netRewards,
        penalty: penalty > 0 ? penalty * grossRewards : 0,
        total: totalAmount,
        daysStaked: Math.floor(daysStaked)
      };

    } catch (error) {
      console.error('Unstake error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's staking positions
   */
  async getUserStakingPositions(userId, status = 'active') {
    try {
      const result = await pool.query(
        `SELECT * FROM staking_positions 
         WHERE user_id = $1 AND status = $2
         ORDER BY created_at DESC`,
        [userId, status]
      );

      // Calculate current rewards for each position
      const positions = result.rows.map(pos => {
        const now = new Date();
        const daysStaked = (now - new Date(pos.started_at)) / (1000 * 60 * 60 * 24);
        const dailyRate = pos.apy_rate / 365 / 100;
        const currentRewards = pos.amount * dailyRate * daysStaked;

        return {
          ...pos,
          daysStaked: Math.floor(daysStaked),
          currentRewards: currentRewards.toFixed(8),
          projectedAnnualRewards: (pos.amount * pos.apy_rate / 100).toFixed(8),
          canUnstake: pos.term === 'flexible' || 
                     (pos.matures_at && now >= new Date(pos.matures_at))
        };
      });

      return {
        success: true,
        positions
      };

    } catch (error) {
      console.error('Get staking positions error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available staking options
   */
  getStakingOptions() {
    const options = [];

    for (const [asset, rates] of Object.entries(this.stakingRates)) {
      for (const [term, apy] of Object.entries(rates)) {
        options.push({
          asset,
          term,
          apy,
          displayName: term === 'flexible' ? 'Flexible' : `${term} Lock`,
          minAmount: this.getMinStakeAmount(asset),
          estimatedRewards: (apy / 100).toFixed(4) // Decimal representation
        });
      }
    }

    return {
      success: true,
      options
    };
  }

  /**
   * Get minimum stake amount
   */
  getMinStakeAmount(asset) {
    const minimums = {
      BTC: 0.001,
      ETH: 0.01,
      SOL: 1,
      ADA: 100,
      DOT: 10
    };

    return minimums[asset] || 0.01;
  }

  /**
   * Calculate staking rewards projection
   */
  calculateProjectedRewards(asset, amount, term, days = null) {
    const apy = this.stakingRates[asset]?.[term];
    
    if (!apy) {
      return {
        success: false,
        error: 'Invalid asset or term'
      };
    }

    // If days not specified, use term duration
    if (!days) {
      days = term === 'flexible' ? 365 : parseInt(term.replace('d', ''));
    }

    const dailyRate = apy / 365 / 100;
    const totalRewards = amount * dailyRate * days;

    return {
      success: true,
      projection: {
        asset,
        amount,
        term,
        apy,
        days,
        estimatedRewards: totalRewards.toFixed(8),
        finalAmount: (amount + totalRewards).toFixed(8)
      }
    };
  }
}

module.exports = new StakingService();

