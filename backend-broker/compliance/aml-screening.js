/**
 * AML (Anti-Money Laundering) Screening
 * Regulatory compliance for financial operations
 */

const logger = require('../utils/logger');
const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);

class AMLScreening {
  /**
   * Screen transaction for suspicious activity
   */
  static async screenTransaction(userId, transactionData) {
    const { type, amount, currency, destination } = transactionData;
    const riskScore = await this.calculateRiskScore(userId, transactionData);
    
    const screening = await qb.insert('aml_screenings', {
      user_id: userId,
      transaction_type: type,
      amount,
      currency,
      risk_score: riskScore,
      risk_level: this.getRiskLevel(riskScore),
      flags: JSON.stringify(await this.getFlags(userId, transactionData)),
      screened_at: new Date(),
      status: riskScore > 70 ? 'review_required' : 'passed'
    });

    logger.info('AML screening completed', {
      userId,
      screeningId: screening.id,
      riskScore,
      status: screening.status
    });

    // Alert compliance team if high risk
    if (riskScore > 70) {
      await this.alertComplianceTeam(userId, screening);
    }

    return screening;
  }

  /**
   * Calculate risk score (0-100)
   */
  static async calculateRiskScore(userId, transactionData) {
    let score = 0;

    // Factor 1: Transaction amount (0-30 points)
    if (transactionData.amount > 10000) score += 30;
    else if (transactionData.amount > 5000) score += 20;
    else if (transactionData.amount > 1000) score += 10;

    // Factor 2: User history (0-20 points)
    const userHistory = await this.getUserHistory(userId);
    if (userHistory.accountAge < 7) score += 20; // New account
    else if (userHistory.accountAge < 30) score += 10;

    // Factor 3: Transaction frequency (0-20 points)
    if (userHistory.transactionsLast24h > 10) score += 20;
    else if (userHistory.transactionsLast24h > 5) score += 10;

    // Factor 4: Geographic risk (0-15 points)
    // In production, check against high-risk countries
    const geoRisk = 0; // Placeholder
    score += geoRisk;

    // Factor 5: Pattern matching (0-15 points)
    const patternRisk = await this.checkSuspiciousPatterns(userId);
    score += patternRisk;

    return Math.min(score, 100);
  }

  /**
   * Get risk level from score
   */
  static getRiskLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get risk flags
   */
  static async getFlags(userId, transactionData) {
    const flags = [];

    // Large transaction flag
    if (transactionData.amount > 10000) {
      flags.push('LARGE_TRANSACTION');
    }

    // New account flag
    const userHistory = await this.getUserHistory(userId);
    if (userHistory.accountAge < 7) {
      flags.push('NEW_ACCOUNT');
    }

    // High frequency flag
    if (userHistory.transactionsLast24h > 10) {
      flags.push('HIGH_FREQUENCY');
    }

    // Round amount flag (possible structuring)
    if (transactionData.amount % 1000 === 0) {
      flags.push('ROUND_AMOUNT');
    }

    return flags;
  }

  /**
   * Get user history for risk assessment
   */
  static async getUserHistory(userId) {
    const user = (await qb.select('users', { id: userId }))[0];
    const accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

    const transactions24h = await qb.query(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = $1 AND created_at >= NOW() - INTERVAL \'24 hours\'',
      [userId]
    );

    return {
      accountAge,
      transactionsLast24h: parseInt(transactions24h[0]?.count || 0),
      kycVerified: user.kyc_verified,
      totalDeposits: 0, // Fetch from deposits table
      totalWithdrawals: 0 // Fetch from withdrawals table
    };
  }

  /**
   * Check for suspicious patterns
   */
  static async checkSuspiciousPatterns(userId) {
    let risk = 0;

    // Pattern 1: Rapid deposit -> withdraw
    const rapidTurnover = await qb.query(`
      SELECT COUNT(*) as count
      FROM deposits d
      INNER JOIN withdrawals w ON w.user_id = d.user_id
      WHERE d.user_id = $1
        AND w.created_at - d.created_at < INTERVAL '1 hour'
        AND d.created_at >= NOW() - INTERVAL '7 days'
    `, [userId]);

    if (parseInt(rapidTurnover[0]?.count || 0) > 0) {
      risk += 15;
    }

    // Pattern 2: Multiple small transactions (structuring)
    const smallTransactions = await qb.query(`
      SELECT COUNT(*) as count
      FROM deposits
      WHERE user_id = $1
        AND amount < 1000
        AND created_at >= NOW() - INTERVAL '24 hours'
    `, [userId]);

    if (parseInt(smallTransactions[0]?.count || 0) > 5) {
      risk += 10;
    }

    return Math.min(risk, 15);
  }

  /**
   * Alert compliance team
   */
  static async alertComplianceTeam(userId, screening) {
    logger.warn('High-risk transaction flagged for review', {
      userId,
      screeningId: screening.id,
      riskScore: screening.risk_score,
      flags: screening.flags
    });

    // In production, send email/Slack notification to compliance team
  }

  /**
   * Manual review decision
   */
  static async reviewDecision(screeningId, decision, reviewerId, notes) {
    await qb.update('aml_screenings',
      {
        status: decision, // 'approved' or 'rejected'
        reviewed_by: reviewerId,
        review_notes: notes,
        reviewed_at: new Date()
      },
      { id: screeningId }
    );

    logger.info('AML screening reviewed', {
      screeningId,
      decision,
      reviewerId
    });
  }
}

module.exports = AMLScreening;

