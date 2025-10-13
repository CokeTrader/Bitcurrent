/**
 * API Key Authentication Middleware
 * Supports both JWT and API key authentication
 */

const { verifyApiKey } = require('../routes/api-keys');
const logger = require('../utils/logger');

/**
 * Combined auth middleware
 * Supports JWT (header: Authorization: Bearer token)
 * Or API key (headers: X-API-Key, X-API-Secret)
 */
async function combinedAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];
    const apiSecret = req.headers['x-api-secret'];
    
    // Try JWT first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.authMethod = 'jwt';
        return next();
      } catch (jwtError) {
        // JWT invalid, try API key
      }
    }
    
    // Try API key
    if (apiKey && apiSecret) {
      const result = await verifyApiKey(apiKey, apiSecret);
      
      if (result) {
        req.user = { 
          id: result.userId,
          permissions: result.permissions
        };
        req.authMethod = 'api_key';
        
        // Check permissions for this route
        const requiredPermission = getRequiredPermission(req);
        if (requiredPermission && !result.permissions.includes(requiredPermission)) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions'
          });
        }
        
        return next();
      }
    }
    
    // No valid auth found
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      hint: 'Provide either JWT token or API key + secret'
    });
    
  } catch (error) {
    logger.error('Combined auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Get required permission for route
 */
function getRequiredPermission(req) {
  const path = req.path;
  
  if (path.includes('/orders') && req.method === 'POST') {
    return 'trade';
  }
  
  if (path.includes('/withdrawals')) {
    return 'withdraw';
  }
  
  // Default: read permission
  return 'read';
}

/**
 * Require specific permissions
 */
function requirePermissions(...permissions) {
  return (req, res, next) => {
    if (req.authMethod !== 'api_key') {
      return next(); // JWT users have all permissions
    }
    
    const hasPermission = permissions.some(p => req.user.permissions.includes(p));
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissions,
        current: req.user.permissions
      });
    }
    
    next();
  };
}

module.exports = {
  combinedAuthMiddleware,
  requirePermissions
};


