/**
 * A/B Testing Service
 * Data-driven experimentation for continuous improvement
 * Based on research: Iterative improvements lead to better user satisfaction
 */

const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);
const logger = require('../utils/logger');

class ABTestingService {
  /**
   * Create new A/B test
   */
  static async createTest(testData) {
    try {
      const { name, description, variants, trafficSplit, startDate, endDate } = testData;

      const test = await qb.insert('ab_tests', {
        name,
        description,
        variants: JSON.stringify(variants),
        traffic_split: JSON.stringify(trafficSplit),
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        created_at: new Date()
      });

      logger.info('A/B test created', { testId: test.id, name });
      return test;
    } catch (error) {
      logger.error('Failed to create A/B test', { error: error.message });
      throw error;
    }
  }

  /**
   * Assign user to test variant
   * Uses consistent hashing for stable assignment
   */
  static assignUserToVariant(userId, testId, variants, trafficSplit) {
    // Simple hash function for consistent assignment
    const hash = userId.toString().split('').reduce((acc, char) => 
      acc + char.charCodeAt(0), 0);
    
    const bucket = hash % 100;
    let cumulativeSplit = 0;

    for (let i = 0; i < variants.length; i++) {
      cumulativeSplit += trafficSplit[i];
      if (bucket < cumulativeSplit) {
        return variants[i];
      }
    }

    return variants[0]; // Fallback to control
  }

  /**
   * Track test event (conversion, click, etc.)
   */
  static async trackEvent(userId, testId, variant, eventType, eventData = {}) {
    try {
      await qb.insert('ab_test_events', {
        user_id: userId,
        test_id: testId,
        variant,
        event_type: eventType,
        event_data: JSON.stringify(eventData),
        created_at: new Date()
      });

      logger.debug('A/B test event tracked', { userId, testId, variant, eventType });
    } catch (error) {
      logger.error('Failed to track A/B test event', { error: error.message });
    }
  }

  /**
   * Get test results with statistical significance
   */
  static async getTestResults(testId) {
    try {
      const sql = `
        SELECT 
          variant,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(*) as total_events,
          COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as conversions,
          CAST(COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) AS FLOAT) / 
            COUNT(DISTINCT user_id) * 100 as conversion_rate
        FROM ab_test_events
        WHERE test_id = $1
        GROUP BY variant
      `;

      const results = await qb.query(sql, [testId]);

      // Calculate lift and statistical significance
      if (results.length >= 2) {
        const control = results.find(r => r.variant === 'A') || results[0];
        const treatment = results.find(r => r.variant === 'B') || results[1];

        const lift = ((treatment.conversion_rate - control.conversion_rate) / 
                     control.conversion_rate) * 100;

        // Simple z-test for significance (p < 0.05)
        const significance = this.calculateSignificance(control, treatment);

        return {
          variants: results,
          analysis: {
            lift: lift.toFixed(2) + '%',
            isSignificant: significance.pValue < 0.05,
            pValue: significance.pValue.toFixed(4),
            recommendation: this.getRecommendation(lift, significance.pValue)
          }
        };
      }

      return { variants: results };
    } catch (error) {
      logger.error('Failed to get test results', { testId, error: error.message });
      throw error;
    }
  }

  /**
   * Calculate statistical significance (simplified z-test)
   */
  static calculateSignificance(control, treatment) {
    const p1 = control.conversion_rate / 100;
    const p2 = treatment.conversion_rate / 100;
    const n1 = parseInt(control.unique_users);
    const n2 = parseInt(treatment.unique_users);

    const p = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
    const z = Math.abs(p2 - p1) / se;

    // Convert z-score to p-value (approximation)
    const pValue = 2 * (1 - this.normalCDF(z));

    return { zScore: z, pValue };
  }

  /**
   * Normal CDF approximation
   */
  static normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }

  /**
   * Get recommendation based on results
   */
  static getRecommendation(lift, pValue) {
    if (pValue < 0.05 && lift > 5) {
      return 'IMPLEMENT - Variant B shows significant improvement';
    } else if (pValue < 0.05 && lift < -5) {
      return 'REJECT - Variant B performs significantly worse';
    } else if (pValue >= 0.05) {
      return 'CONTINUE TESTING - Not enough data for confident decision';
    } else {
      return 'INCONCLUSIVE - Small difference, consider business factors';
    }
  }

  /**
   * Get active tests for user
   */
  static async getActiveTestsForUser(userId) {
    try {
      const tests = await qb.query(`
        SELECT * FROM ab_tests
        WHERE status = 'active'
          AND start_date <= NOW()
          AND (end_date IS NULL OR end_date >= NOW())
      `);

      return tests.map(test => ({
        testId: test.id,
        name: test.name,
        variant: this.assignUserToVariant(
          userId,
          test.id,
          JSON.parse(test.variants),
          JSON.parse(test.traffic_split)
        )
      }));
    } catch (error) {
      logger.error('Failed to get active tests', { userId, error: error.message });
      return [];
    }
  }
}

module.exports = ABTestingService;

