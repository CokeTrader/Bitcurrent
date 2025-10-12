// Admin dashboard routes
const express = require('express');
const { query } = require('../config/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin access
router.use(verifyToken);
router.use(requireAdmin);

/**
 * GET /admin/dashboard/stats
 * Get real-time dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get total users count
    const usersResult = await query(
      'SELECT COUNT(*) as total FROM users'
    );
    const totalUsers = parseInt(usersResult.rows[0].total);

    // Get active users (logged in within last 7 days)
    const activeUsersResult = await query(
      `SELECT COUNT(*) as active FROM users 
       WHERE last_login_at > NOW() - INTERVAL '7 days'`
    );
    const activeUsers = parseInt(activeUsersResult.rows[0]?.active || 0);

    // Get total trading volume
    const volumeResult = await query(
      `SELECT COALESCE(SUM(filled_quantity * average_price), 0) as volume 
       FROM orders 
       WHERE status = 'filled'`
    );
    const totalVolume = parseFloat(volumeResult.rows[0]?.volume || 0);

    // Get total orders count
    const ordersResult = await query(
      'SELECT COUNT(*) as total FROM orders'
    );
    const totalOrders = parseInt(ordersResult.rows[0].total);

    // Get failed orders count
    const failedOrdersResult = await query(
      `SELECT COUNT(*) as failed FROM orders 
       WHERE status IN ('failed', 'rejected', 'cancelled')`
    );
    const failedOrders = parseInt(failedOrdersResult.rows[0].failed);

    // Determine system health based on error rate
    const errorRate = totalOrders > 0 ? (failedOrders / totalOrders) : 0;
    let systemHealth = 'healthy';
    if (errorRate > 0.1) systemHealth = 'warning';
    if (errorRate > 0.2) systemHealth = 'critical';

    // Get recent errors (if you have an errors table)
    // For now, we'll use order failures as proxy
    const recentErrorsResult = await query(
      `SELECT 
        id,
        symbol,
        side,
        status as message,
        created_at as timestamp,
        CASE 
          WHEN status = 'failed' THEN 'critical'
          WHEN status = 'rejected' THEN 'warning'
          ELSE 'info'
        END as severity
       FROM orders 
       WHERE status IN ('failed', 'rejected')
       AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 10`
    );

    const recentErrors = recentErrorsResult.rows.map(row => ({
      id: row.id,
      message: `Order ${row.id.slice(0, 8)} - ${row.symbol} ${row.side} ${row.message}`,
      timestamp: row.timestamp,
      severity: row.severity
    }));

    res.json({
      totalUsers,
      activeUsers,
      totalVolume,
      totalOrders,
      failedOrders,
      systemHealth,
      recentErrors
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * GET /admin/dashboard/users-growth
 * Get user growth over time
 */
router.get('/users-growth', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
       FROM users
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Users growth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user growth data'
    });
  }
});

/**
 * GET /admin/dashboard/volume-chart
 * Get trading volume over time
 */
router.get('/volume-chart', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(filled_quantity * average_price), 0) as volume,
        COUNT(*) as order_count
       FROM orders
       WHERE created_at > NOW() - INTERVAL '30 days'
         AND status = 'filled'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Volume chart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volume data'
    });
  }
});

/**
 * GET /admin/dashboard/system-health
 * Get detailed system health metrics
 */
router.get('/system-health', async (req, res) => {
  try {
    // Check database connection
    const dbCheck = await query('SELECT NOW()');
    const dbHealthy = dbCheck.rows.length > 0;

    // Check recent order processing time
    const recentOrders = await query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time
       FROM orders
       WHERE created_at > NOW() - INTERVAL '1 hour'
         AND status IN ('filled', 'completed')`
    );
    const avgProcessingTime = parseFloat(recentOrders.rows[0]?.avg_processing_time || 0);

    // System is healthy if database is up and processing time is reasonable
    const systemHealthy = dbHealthy && avgProcessingTime < 10; // Under 10 seconds

    res.json({
      success: true,
      health: {
        database: dbHealthy ? 'healthy' : 'down',
        orderProcessing: avgProcessingTime < 10 ? 'healthy' : 'slow',
        avgProcessingTime: avgProcessingTime.toFixed(2),
        overall: systemHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      health: {
        database: 'down',
        orderProcessing: 'unknown',
        overall: 'down',
        error: error.message
      }
    });
  }
});

module.exports = router;


