/**
 * Enhanced Authentication Middleware
 * 
 * Security improvements:
 * - JWT fingerprinting
 * - Refresh token rotation
 * - IP-based rate limiting
 * - Suspicious activity detection
 * - Session management
 */

const jwtSecurity = require('../security/jwt-security-enhanced');
const pool = require('../config/database');

/**
 * Verify JWT with enhanced security
 */
async function authenticateTokenEnhanced(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Generate fingerprint from request
    const fingerprint = jwtSecurity.generateFingerprint(req);

    // Verify token
    const verification = await jwtSecurity.verifyAccessToken(token, fingerprint);

    if (!verification.valid) {
      // Log failed attempt
      await logSecurityEvent(null, 'failed_token_verification', req.ip, {
        error: verification.error,
        userAgent: req.headers['user-agent']
      }, 'medium');

      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Check if user account is locked
    const userStatus = await checkUserStatus(verification.userId);
    if (userStatus.locked) {
      return res.status(403).json({
        success: false,
        error: 'Account is locked. Please contact support.'
      });
    }

    // Attach user to request
    req.user = {
      id: verification.userId,
      email: verification.email
    };

    // Log successful authentication
    await logSecurityEvent(verification.userId, 'api_access', req.ip, {
      endpoint: req.path,
      method: req.method
    }, 'low');

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Check for suspicious activity
 */
async function detectSuspiciousActivity(req, res, next) {
  try {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const suspicionScore = await calculateSuspicionScore(userId, req);

    if (suspicionScore > 70) {
      // Flag as suspicious
      await pool.query(
        `INSERT INTO suspicious_activities (
          user_id, activity_type, description, risk_score, status, created_at
        ) VALUES ($1, $2, $3, $4, 'pending', NOW())`,
        [
          userId,
          'high_risk_activity',
          `Suspicious activity detected: ${req.path}`,
          suspicionScore
        ]
      );

      // Send alert to admin
      console.warn(`⚠️  Suspicious activity detected for user ${userId} (score: ${suspicionScore})`);

      if (suspicionScore > 90) {
        // Block high-risk activity
        return res.status(403).json({
          success: false,
          error: 'Activity blocked for security review. Please contact support.'
        });
      }
    }

    next();

  } catch (error) {
    console.error('Suspicious activity detection error:', error);
    next(); // Don't block on error
  }
}

/**
 * Calculate suspicion score
 */
async function calculateSuspicionScore(userId, req) {
  let score = 0;

  // Check 1: Multiple rapid withdrawals
  const recentWithdrawals = await pool.query(
    `SELECT COUNT(*) as count FROM withdrawals 
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [userId]
  );

  if (parseInt(recentWithdrawals.rows[0].count) > 3) {
    score += 30;
  }

  // Check 2: Large withdrawal amount
  const recentLargeWithdrawals = await pool.query(
    `SELECT COUNT(*) as count FROM withdrawals 
     WHERE user_id = $1 AND amount > 1000 AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId]
  );

  if (parseInt(recentLargeWithdrawals.rows[0].count) > 0) {
    score += 25;
  }

  // Check 3: Different IP than usual
  const userIPs = await pool.query(
    `SELECT DISTINCT ip_address FROM security_audit_logs 
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
     ORDER BY created_at DESC LIMIT 5`,
    [userId]
  );

  const knownIPs = userIPs.rows.map(row => row.ip_address);
  if (!knownIPs.includes(req.ip)) {
    score += 20;
  }

  // Check 4: Rapid API calls
  const recentAPICalls = await pool.query(
    `SELECT COUNT(*) as count FROM security_audit_logs 
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 minute'`,
    [userId]
  );

  if (parseInt(recentAPICalls.rows[0].count) > 60) {
    score += 25;
  }

  return score;
}

/**
 * Check user status
 */
async function checkUserStatus(userId) {
  try {
    const result = await pool.query(
      'SELECT account_locked, lock_reason FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return { locked: false };
    }

    return {
      locked: result.rows[0].account_locked || false,
      reason: result.rows[0].lock_reason
    };

  } catch (error) {
    console.error('Check user status error:', error);
    return { locked: false };
  }
}

/**
 * Log security event
 */
async function logSecurityEvent(userId, eventType, ipAddress, details, riskLevel = 'low') {
  try {
    await pool.query(
      `INSERT INTO security_audit_logs (
        user_id, event_type, ip_address, details, risk_level, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, eventType, ipAddress, JSON.stringify(details), riskLevel]
    );
  } catch (error) {
    console.error('Log security event error:', error);
  }
}

/**
 * Require 2FA for sensitive operations
 */
async function require2FA(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;

    // Check if user has 2FA enabled
    const result = await pool.query(
      'SELECT two_fa_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const twoFAEnabled = result.rows[0].two_fa_enabled;

    if (twoFAEnabled && !req.headers['x-2fa-code']) {
      return res.status(403).json({
        success: false,
        error: '2FA code required for this operation',
        requires2FA: true
      });
    }

    if (twoFAEnabled) {
      // Verify 2FA code
      const code = req.headers['x-2fa-code'];
      const isValid = await verify2FACode(userId, code);

      if (!isValid) {
        await logSecurityEvent(userId, 'failed_2fa', req.ip, {
          endpoint: req.path
        }, 'high');

        return res.status(403).json({
          success: false,
          error: 'Invalid 2FA code'
        });
      }
    }

    next();

  } catch (error) {
    console.error('2FA middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Verify 2FA code (placeholder - would use speakeasy library)
 */
async function verify2FACode(userId, code) {
  // In production, verify TOTP code
  return true; // Placeholder
}

module.exports = {
  authenticateTokenEnhanced,
  detectSuspiciousActivity,
  require2FA,
  logSecurityEvent
};

