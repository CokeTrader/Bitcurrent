/**
 * Notifications API
 * Manage user notifications, price alerts, etc.
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// In-memory storage (replace with database in production)
const priceAlerts = new Map();
const userNotifications = new Map();

/**
 * Get user notifications
 * GET /api/v1/notifications
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = userNotifications.get(userId) || [];
    
    res.json({
      success: true,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt
      }))
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

/**
 * Mark notification as read
 * PUT /api/v1/notifications/:id/read
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const notifications = userNotifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    notification.read = true;
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification'
    });
  }
});

/**
 * Create price alert
 * POST /api/v1/notifications/price-alerts
 */
router.post('/price-alerts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, targetPrice, direction } = req.body;
    
    // Validation
    if (!symbol || !targetPrice || !direction) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    if (!['above', 'below'].includes(direction)) {
      return res.status(400).json({
        success: false,
        error: 'Direction must be "above" or "below"'
      });
    }
    
    const alertId = `${userId}_${symbol}_${Date.now()}`;
    const alert = {
      id: alertId,
      userId,
      symbol,
      targetPrice: parseFloat(targetPrice),
      direction,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    // Store alert
    if (!priceAlerts.has(userId)) {
      priceAlerts.set(userId, []);
    }
    priceAlerts.get(userId).push(alert);
    
    logger.info('Price alert created', { userId, symbol, targetPrice, direction });
    
    res.json({
      success: true,
      alert: {
        id: alert.id,
        symbol: alert.symbol,
        targetPrice: alert.targetPrice,
        direction: alert.direction,
        createdAt: alert.createdAt
      }
    });
  } catch (error) {
    logger.error('Create price alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create price alert'
    });
  }
});

/**
 * Get user's price alerts
 * GET /api/v1/notifications/price-alerts
 */
router.get('/price-alerts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const alerts = priceAlerts.get(userId) || [];
    
    res.json({
      success: true,
      alerts: alerts.filter(a => a.active).map(a => ({
        id: a.id,
        symbol: a.symbol,
        targetPrice: a.targetPrice,
        direction: a.direction,
        createdAt: a.createdAt
      }))
    });
  } catch (error) {
    logger.error('Get price alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price alerts'
    });
  }
});

/**
 * Delete price alert
 * DELETE /api/v1/notifications/price-alerts/:id
 */
router.delete('/price-alerts/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const alertId = req.params.id;
    
    const alerts = priceAlerts.get(userId) || [];
    const alert = alerts.find(a => a.id === alertId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Price alert not found'
      });
    }
    
    alert.active = false;
    
    logger.info('Price alert deleted', { userId, alertId });
    
    res.json({
      success: true,
      message: 'Price alert deleted'
    });
  } catch (error) {
    logger.error('Delete price alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete price alert'
    });
  }
});

/**
 * Helper: Add notification to user
 */
function addNotification(userId, notification) {
  if (!userNotifications.has(userId)) {
    userNotifications.set(userId, []);
  }
  
  const notif = {
    id: `notif_${Date.now()}`,
    ...notification,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  userNotifications.get(userId).unshift(notif);
  
  // Keep only last 100 notifications
  const notifications = userNotifications.get(userId);
  if (notifications.length > 100) {
    userNotifications.set(userId, notifications.slice(0, 100));
  }
  
  return notif;
}

module.exports = router;
module.exports.addNotification = addNotification;

