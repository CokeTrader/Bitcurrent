// Authentication middleware
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verify JWT token and attach user to request
 */
function verifyToken(req, res, next) {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

/**
 * Optional auth - doesn't fail if no token, just doesn't attach user
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      // Token invalid but we don't fail
      req.user = null;
    }
  }
  
  next();
}

/**
 * Admin only middleware (checks if user is admin)
 */
async function requireAdmin(req, res, next) {
  // For MVP, check if user email matches admin email
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  next();
}

/**
 * Generate JWT token
 */
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' } // 7 days
  );
}

/**
 * Generate refresh token (longer lived)
 */
function generateRefreshToken(userId, email) {
  return jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' } // 30 days
  );
}

module.exports = {
  verifyToken,
  optionalAuth,
  requireAdmin,
  generateToken,
  generateRefreshToken
};

