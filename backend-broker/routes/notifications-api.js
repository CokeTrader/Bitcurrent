/**
 * Notifications API Routes
 */

const express = require('express');
const router = express.Router();
const { enhancedAuth } = require('../middleware/advanced-auth');
const QueryBuilder = require('../database/query-builder');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const qb = new QueryBuilder(pool);

/**
 * GET /api/v1/notifications
 * Get user notifications
 */
router.get('/',
  enhancedAuth,
  async (req, res, next) => {
    try {
      const { unread, limit = 50 } = req.query;

      const sql = `
        SELECT * FROM notifications
        WHERE user_id = $1
        ${unread === 'true' ? 'AND read = false' : ''}
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const notifications = await qb.query(sql, [req.userId, parseInt(limit)]);

      res.json({
        success: true,
        notifications,
        unreadCount: notifications.filter(n => !n.read).length
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.post('/:id/read',
  enhancedAuth,
  async (req, res, next) => {
    try {
      await qb.update('notifications',
        { read: true, read_at: new Date() },
        { id: req.params.id, user_id: req.userId }
      );

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all',
  enhancedAuth,
  async (req, res, next) => {
    try {
      await qb.query(
        'UPDATE notifications SET read = true, read_at = NOW() WHERE user_id = $1 AND read = false',
        [req.userId]
      );

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/notifications/:id
 * Delete notification
 */
router.delete('/:id',
  enhancedAuth,
  async (req, res, next) => {
    try {
      await qb.delete('notifications', {
        id: req.params.id,
        user_id: req.userId
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

