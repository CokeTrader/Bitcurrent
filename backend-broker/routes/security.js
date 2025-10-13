/**
 * Security Features API
 * 2FA, session management, security settings
 */

const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// In-memory storage (replace with database)
const twoFactorSecrets = new Map();
const activeSessions = new Map();

/**
 * Enable 2FA - Generate secret
 * POST /api/v1/security/2fa/enable
 */
router.post('/2fa/enable', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `BitCurrent (${userEmail})`,
      issuer: 'BitCurrent'
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    // Store secret temporarily (until verified)
    twoFactorSecrets.set(userId, {
      secret: secret.base32,
      verified: false,
      createdAt: new Date().toISOString()
    });
    
    logger.info('2FA setup initiated', { userId });
    
    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan QR code with authenticator app (Google Authenticator, Authy)'
    });
  } catch (error) {
    logger.error('Enable 2FA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable 2FA'
    });
  }
});

/**
 * Verify 2FA code
 * POST /api/v1/security/2fa/verify
 */
router.post('/2fa/verify', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code required'
      });
    }
    
    const userSecret = twoFactorSecrets.get(userId);
    if (!userSecret) {
      return res.status(400).json({
        success: false,
        error: '2FA not initiated. Call /2fa/enable first.'
      });
    }
    
    // Verify code
    const verified = speakeasy.totp.verify({
      secret: userSecret.secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 time steps before/after
    });
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
    
    // Mark as verified
    userSecret.verified = true;
    
    // TODO: Update user in database
    // await db.query('UPDATE users SET two_factor_enabled = true WHERE id = $1', [userId]);
    
    logger.info('2FA enabled successfully', { userId });
    
    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    logger.error('Verify 2FA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify 2FA'
    });
  }
});

/**
 * Disable 2FA
 * POST /api/v1/security/2fa/disable
 */
router.post('/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    const userSecret = twoFactorSecrets.get(userId);
    if (!userSecret || !userSecret.verified) {
      return res.status(400).json({
        success: false,
        error: '2FA not enabled'
      });
    }
    
    // Verify code before disabling
    const verified = speakeasy.totp.verify({
      secret: userSecret.secret,
      encoding: 'base32',
      token: code,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
    
    // Remove secret
    twoFactorSecrets.delete(userId);
    
    logger.info('2FA disabled', { userId });
    
    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    logger.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable 2FA'
    });
  }
});

/**
 * Get active sessions
 * GET /api/v1/security/sessions
 */
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userSessions = activeSessions.get(userId) || [];
    
    res.json({
      success: true,
      sessions: userSessions.map(s => ({
        id: s.id,
        device: s.device,
        browser: s.browser,
        ip: s.ip,
        location: s.location,
        current: s.id === req.sessionId,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt
      }))
    });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

/**
 * Revoke session
 * DELETE /api/v1/security/sessions/:id
 */
router.delete('/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;
    
    const userSessions = activeSessions.get(userId) || [];
    const sessionIndex = userSessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    userSessions.splice(sessionIndex, 1);
    
    logger.info('Session revoked', { userId, sessionId });
    
    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    logger.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke session'
    });
  }
});

/**
 * Get security activity log
 * GET /api/v1/security/activity
 */
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // TODO: Get from audit_log table
    const activities = [
      {
        action: 'login',
        ip: '1.2.3.4',
        device: 'Chrome on macOS',
        location: 'London, UK',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    logger.error('Get security activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    });
  }
});

module.exports = router;


