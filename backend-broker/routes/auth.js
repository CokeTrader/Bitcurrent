// Authentication routes
const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const zxcvbn = require('zxcvbn');
// Temporarily disable passport to debug crash
// const passport = require('../config/passport');
const { query } = require('../config/database');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Google OAuth routes - TEMPORARILY DISABLED
// TODO: Re-enable once backend is stable
/*
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/auth/login?error=oauth_failed'
  }),
  (req, res) => {
    // Generate JWT tokens
    const token = generateToken(req.user.id, req.user.email);
    const refreshToken = generateRefreshToken(req.user.id, req.user.email);
    
    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'https://bitcurrent-git-main-coketraders-projects.vercel.app';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&refresh=${refreshToken}`);
  }
);
*/

/**
 * POST /auth/register
 * Register new user
 */
router.post('/register', validateRegistration, async (req, res) => {
  try {
    let { email, password, firstName, lastName } = req.body;
    
    // Input sanitization
    email = validator.trim(email || '');
    firstName = firstName ? validator.escape(validator.trim(firstName)) : null;
    lastName = lastName ? validator.escape(validator.trim(lastName)) : null;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }
    
    // Password strength check (zxcvbn score: 0-4, require 3+)
    const passwordStrength = zxcvbn(password);
    if (passwordStrength.score < 3) {
      return res.status(400).json({
        success: false,
        error: 'Password is too weak. Try adding numbers, symbols, and mixing cases.',
        suggestions: passwordStrength.feedback.suggestions
      });
    }
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    const result = await query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, created_at`,
      [userId, email.toLowerCase(), passwordHash, firstName || null, lastName || null]
    );
    
    const user = result.rows[0];
    
    // Generate tokens
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account'
    });
  }
});

/**
 * POST /auth/login
 * Login user
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Get user
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, kyc_status, status
       FROM users 
       WHERE email = $1`,
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    const user = result.rows[0];
    
    // Check if account is active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Account is suspended or closed'
      });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Generate tokens
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        kycStatus: user.kyc_status
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(403).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    
    // Generate new access token
    const token = generateToken(decoded.userId, decoded.email);
    
    res.json({
      success: true,
      token
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    // This would need verifyToken middleware in server.js
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
    
    const result = await query(
      `SELECT id, email, first_name, last_name, kyc_status, status, created_at, last_login
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        kycStatus: user.kyc_status,
        status: user.status,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

module.exports = router;

