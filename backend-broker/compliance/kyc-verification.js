/**
 * KYC Verification Service
 * Identity verification and compliance
 */

const logger = require('../utils/logger');
const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);

class KYCVerification {
  /**
   * Submit KYC documents
   */
  static async submitDocuments(userId, documents) {
    try {
      const { idType, idNumber, idFrontImage, idBackImage, selfieImage, addressProof } = documents;

      // Validate required fields
      if (!idType || !idNumber || !idFrontImage || !selfieImage) {
        throw new Error('Missing required documents');
      }

      // Create KYC submission
      const submission = await qb.insert('kyc_submissions', {
        user_id: userId,
        id_type: idType,
        id_number: idNumber,
        id_front_image: idFrontImage,
        id_back_image: idBackImage,
        selfie_image: selfieImage,
        address_proof: addressProof,
        status: 'pending',
        submitted_at: new Date()
      });

      // Perform automatic checks
      const autoCheckResults = await this.performAutoChecks(submission);

      // Update submission with auto-check results
      await qb.update('kyc_submissions',
        {
          auto_check_results: JSON.stringify(autoCheckResults),
          auto_check_score: autoCheckResults.score
        },
        { id: submission.id }
      );

      // If auto-checks fail, flag for manual review
      if (autoCheckResults.score < 70) {
        await this.flagForManualReview(submission.id, 'Low auto-check score');
      }

      logger.info('KYC documents submitted', {
        userId,
        submissionId: submission.id,
        autoCheckScore: autoCheckResults.score
      });

      return submission;
    } catch (error) {
      logger.error('KYC submission failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Perform automatic verification checks
   */
  static async performAutoChecks(submission) {
    const checks = {
      documentQuality: this.checkDocumentQuality(submission),
      faceMatch: this.checkFaceMatch(submission),
      documentAuthenticity: this.checkDocumentAuthenticity(submission),
      addressMatch: this.checkAddressMatch(submission)
    };

    const scores = Object.values(checks);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      score: Math.round(avgScore),
      checks,
      passed: avgScore >= 70,
      timestamp: Date.now()
    };
  }

  /**
   * Check document image quality
   */
  static checkDocumentQuality(submission) {
    // In production, use computer vision API (e.g., AWS Rekognition)
    // Check for blur, glare, completeness
    return Math.random() * 30 + 70; // Mock score 70-100
  }

  /**
   * Check if selfie matches ID photo
   */
  static checkFaceMatch(submission) {
    // In production, use face recognition API
    return Math.random() * 30 + 70; // Mock score 70-100
  }

  /**
   * Check document authenticity
   */
  static checkDocumentAuthenticity(submission) {
    // In production, check for:
    // - Security features (holograms, watermarks)
    // - Font consistency
    // - Data validation (checksum digits)
    return Math.random() * 30 + 70; // Mock score 70-100
  }

  /**
   * Check address proof matches ID
   */
  static checkAddressMatch(submission) {
    // In production, OCR + address validation
    return Math.random() * 30 + 70; // Mock score 70-100
  }

  /**
   * Flag submission for manual review
   */
  static async flagForManualReview(submissionId, reason) {
    await qb.update('kyc_submissions',
      {
        status: 'manual_review',
        review_reason: reason,
        flagged_at: new Date()
      },
      { id: submissionId }
    );

    logger.warn('KYC submission flagged for manual review', {
      submissionId,
      reason
    });
  }

  /**
   * Manual review decision
   */
  static async manualReview(submissionId, decision, reviewerId, notes) {
    const status = decision === 'approve' ? 'approved' : 'rejected';

    await qb.update('kyc_submissions',
      {
        status,
        reviewed_by: reviewerId,
        review_notes: notes,
        reviewed_at: new Date()
      },
      { id: submissionId }
    );

    // If approved, update user status
    if (decision === 'approve') {
      const submission = (await qb.select('kyc_submissions', { id: submissionId }))[0];
      await qb.update('users',
        { kyc_verified: true, kyc_verified_at: new Date() },
        { id: submission.user_id }
      );
    }

    logger.info('KYC manual review completed', {
      submissionId,
      decision,
      reviewerId
    });

    return true;
  }

  /**
   * Get KYC status for user
   */
  static async getKYCStatus(userId) {
    const submissions = await qb.select('kyc_submissions', 
      { user_id: userId },
      'id, status, submitted_at, reviewed_at, auto_check_score'
    );

    const latest = submissions.sort((a, b) => 
      new Date(b.submitted_at) - new Date(a.submitted_at)
    )[0];

    return latest || { status: 'not_submitted' };
  }

  /**
   * Get pending reviews (for admin)
   */
  static async getPendingReviews(limit = 50) {
    const sql = `
      SELECT s.*, u.email, u.created_at as account_created
      FROM kyc_submissions s
      JOIN users u ON u.id = s.user_id
      WHERE s.status IN ('pending', 'manual_review')
      ORDER BY s.submitted_at ASC
      LIMIT $1
    `;

    return await qb.query(sql, [limit]);
  }
}

module.exports = KYCVerification;

