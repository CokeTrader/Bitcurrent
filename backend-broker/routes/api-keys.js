/**
 * API Keys Management
 * Allow users to create API keys for trading bots
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// In-memory storage (replace with database)
const apiKeys = new Map();

/**
 * Generate API key pair
 */
function generateApiKey() {
  const keyId = 'BC' + crypto.randomBytes(16).toString('hex');
  const secretKey = crypto.randomBytes(32).toString('hex');
  const hashedSecret = crypto.createHash('sha256').update(secretKey).digest('hex');
  
  return { keyId, secretKey, hashedSecret };
}

/**
 * Get user's API keys
 * GET /api/v1/api-keys
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userKeys = apiKeys.get(userId) || [];
    
    // Return keys without secrets
    const sanitizedKeys = userKeys.map(key => ({
      id: key.id,
      keyId: key.keyId,
      name: key.name,
      permissions: key.permissions,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      status: key.status
    }));
    
    res.json({
      success: true,
      apiKeys: sanitizedKeys
    });
  } catch (error) {
    logger.error('Get API keys error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys'
    });
  }
});

/**
 * Create new API key
 * POST /api/v1/api-keys
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, permissions, expiresIn } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'API key name is required'
      });
    }
    
    const validPermissions = ['read', 'trade', 'withdraw'];
    const keyPermissions = permissions || ['read', 'trade'];
    
    if (!keyPermissions.every(p => validPermissions.includes(p))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid permissions'
      });
    }
    
    // Limit to 5 keys per user
    const userKeys = apiKeys.get(userId) || [];
    const activeKeys = userKeys.filter(k => k.status === 'active');
    
    if (activeKeys.length >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 active API keys allowed'
      });
    }
    
    // Generate key pair
    const { keyId, secretKey, hashedSecret } = generateApiKey();
    
    // Calculate expiry
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
      : null;
    
    const apiKey = {
      id: `api_key_${Date.now()}`,
      keyId,
      hashedSecret,
      name,
      permissions: keyPermissions,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt
    };
    
    if (!apiKeys.has(userId)) {
      apiKeys.set(userId, []);
    }
    apiKeys.get(userId).push(apiKey);
    
    logger.info('API key created', { userId, keyId, permissions: keyPermissions });
    
    // Return secret ONLY once
    res.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        keyId: apiKey.keyId,
        secretKey: secretKey, // ONLY shown on creation
        name: apiKey.name,
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt
      },
      warning: 'Save your secret key now. It will not be shown again.'
    });
  } catch (error) {
    logger.error('Create API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key'
    });
  }
});

/**
 * Revoke API key
 * DELETE /api/v1/api-keys/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = req.params.id;
    
    const userKeys = apiKeys.get(userId) || [];
    const key = userKeys.find(k => k.id === keyId);
    
    if (!key) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }
    
    key.status = 'revoked';
    key.revokedAt = new Date().toISOString();
    
    logger.info('API key revoked', { userId, keyId });
    
    res.json({
      success: true,
      message: 'API key revoked'
    });
  } catch (error) {
    logger.error('Revoke API key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

/**
 * Verify API key (used by auth middleware)
 */
async function verifyApiKey(keyId, secretKey) {
  try {
    const hashedSecret = crypto.createHash('sha256').update(secretKey).digest('hex');
    
    // Find key across all users
    for (const [userId, userKeys] of apiKeys.entries()) {
      const key = userKeys.find(k => 
        k.keyId === keyId && 
        k.hashedSecret === hashedSecret &&
        k.status === 'active'
      );
      
      if (key) {
        // Check expiry
        if (key.expiresAt && new Date() > new Date(key.expiresAt)) {
          return null;
        }
        
        // Update last used
        key.lastUsedAt = new Date().toISOString();
        
        return { userId, permissions: key.permissions };
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Verify API key error:', error);
    return null;
  }
}

module.exports = router;
module.exports.verifyApiKey = verifyApiKey;

