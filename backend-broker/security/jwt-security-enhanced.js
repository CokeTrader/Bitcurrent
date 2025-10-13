/**
 * Enhanced JWT Security
 * 
 * Improvements based on OWASP best practices:
 * - Refresh token rotation
 * - Token blacklisting
 * - Short-lived access tokens
 * - Secure storage
 * - Token fingerprinting
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');

class JWTSecurityService {
  constructor() {
    this.accessTokenExpiry = '15m'; // Short-lived access tokens
    this.refreshTokenExpiry = '7d'; // Longer-lived refresh tokens
    this.jwtSecret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || this.jwtSecret + '_refresh';
  }

  /**
   * Generate access token with fingerprint
   */
  generateAccessToken(userId, email, fingerprint) {
    const payload = {
      userId,
      email,
      type: 'access',
      fingerprint: crypto.createHash('sha256').update(fingerprint).digest('hex'),
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'bitcurrent.co.uk',
      audience: 'bitcurrent-api'
    });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(userId, fingerprint) {
    const tokenId = crypto.randomBytes(32).toString('hex');
    
    const payload = {
      userId,
      tokenId,
      type: 'refresh',
      fingerprint: crypto.createHash('sha256').update(fingerprint).digest('hex'),
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshTokenExpiry
    });

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_id, fingerprint_hash, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, tokenId, crypto.createHash('sha256').update(fingerprint).digest('hex'), expiresAt]
    );

    return { token, tokenId };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token, fingerprint) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'bitcurrent.co.uk',
        audience: 'bitcurrent-api'
      });

      // Verify fingerprint matches
      const expectedFingerprint = crypto.createHash('sha256').update(fingerprint).digest('hex');
      if (decoded.fingerprint !== expectedFingerprint) {
        throw new Error('Token fingerprint mismatch - possible token theft');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      return {
        valid: true,
        userId: decoded.userId,
        email: decoded.email
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken, fingerprint) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret);

      // Verify fingerprint
      const expectedFingerprint = crypto.createHash('sha256').update(fingerprint).digest('hex');
      if (decoded.fingerprint !== expectedFingerprint) {
        throw new Error('Fingerprint mismatch');
      }

      // Verify refresh token exists and is valid in database
      const result = await pool.query(
        `SELECT * FROM refresh_tokens 
         WHERE user_id = $1 AND token_id = $2 AND revoked = false AND expires_at > NOW()`,
        [decoded.userId, decoded.tokenId]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid or expired refresh token');
      }

      // Get user details
      const userResult = await pool.query(
        'SELECT id, email FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user.id, user.email, fingerprint);

      // Rotate refresh token (optional, for extra security)
      const newRefreshToken = await this.generateRefreshToken(user.id, fingerprint);

      // Revoke old refresh token
      await pool.query(
        'UPDATE refresh_tokens SET revoked = true WHERE token_id = $1',
        [decoded.tokenId]
      );

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken.token
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Blacklist a token (logout)
   */
  async blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded) {
        return { success: false, error: 'Invalid token' };
      }

      const expiresAt = new Date(decoded.exp * 1000);

      await pool.query(
        `INSERT INTO token_blacklist (token_hash, user_id, expires_at, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [crypto.createHash('sha256').update(token).digest('hex'), decoded.userId, expiresAt]
      );

      return { success: true };

    } catch (error) {
      console.error('Blacklist token error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const result = await pool.query(
        `SELECT id FROM token_blacklist 
         WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
      );

      return result.rows.length > 0;

    } catch (error) {
      console.error('Check blacklist error:', error);
      return false;
    }
  }

  /**
   * Revoke all user tokens (force logout all devices)
   */
  async revokeAllUserTokens(userId) {
    try {
      await pool.query(
        'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
        [userId]
      );

      return {
        success: true,
        message: 'All tokens revoked'
      };

    } catch (error) {
      console.error('Revoke all tokens error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup expired tokens (run daily)
   */
  async cleanupExpiredTokens() {
    try {
      // Remove expired blacklisted tokens
      await pool.query(
        'DELETE FROM token_blacklist WHERE expires_at < NOW()'
      );

      // Remove expired refresh tokens
      await pool.query(
        'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
      );

      console.log('✅ Expired tokens cleaned up');
      
      return { success: true };

    } catch (error) {
      console.error('Cleanup tokens error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate browser fingerprint from request
   */
  generateFingerprint(req) {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.ip || '',
      req.headers['accept'] || ''
    ];

    return crypto.createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }
}

module.exports = new JWTSecurityService();

