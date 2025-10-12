// Two-Factor Authentication routes
const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate 2FA secret and QR code
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if 2FA already enabled
    const user = await query(
      'SELECT two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows[0]?.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        error: '2FA is already enabled'
      });
    }
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Bitcurrent (${req.user.email})`,
      issuer: 'Bitcurrent'
    });
    
    // Save temp secret (not enabled yet)
    await query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    res.json({
      success: true,
      secret: secret.base32,
      qrCode,
      message: 'Scan QR code with authenticator app and verify to enable 2FA'
    });
    
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup 2FA'
    });
  }
});

// Verify and enable 2FA
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Verification code required'
      });
    }
    
    // Get secret
    const user = await query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId]
    );
    
    const secret = user.rows[0]?.two_factor_secret;
    if (!secret) {
      return res.status(400).json({
        success: false,
        error: '2FA not set up. Call /setup first'
      });
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
    
    // Enable 2FA
    await query(
      'UPDATE users SET two_factor_enabled = true WHERE id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
    
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify 2FA'
    });
  }
});

// Disable 2FA
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const { token, password } = req.body;
    const userId = req.user.id;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Verification code and password required'
      });
    }
    
    // Get user
    const user = await query(
      'SELECT two_factor_secret, two_factor_enabled, password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (!user.rows[0]?.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        error: '2FA is not enabled'
      });
    }
    
    // Verify password
    const bcrypt = require('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }
    
    // Verify 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.rows[0].two_factor_secret,
      encoding: 'base32',
      token,
      window: 2
    });
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
    
    // Disable 2FA
    await query(
      'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
    
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable 2FA'
    });
  }
});

// Check 2FA status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await query(
      'SELECT two_factor_enabled FROM users WHERE id = $1',
      [req.user.id]
    );
    
    res.json({
      success: true,
      enabled: user.rows[0]?.two_factor_enabled || false
    });
    
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get 2FA status'
    });
  }
});

module.exports = router;

