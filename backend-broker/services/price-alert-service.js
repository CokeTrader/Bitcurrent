/**
 * Price Alert & Watchlist Service
 * 
 * Features:
 * - Set price alerts (above/below target)
 * - Custom watchlists
 * - Real-time price monitoring
 * - Email/SMS/Push notifications
 * - Alert history
 */

const pool = require('../config/database');
const multiAssetService = require('./multi-asset-trading-service');
const emailNotificationService = require('./email-notification-service');

class PriceAlertService {
  constructor() {
    this.monitoringInterval = null;
    this.checkInterval = 30000; // Check every 30 seconds
  }

  /**
   * Create price alert
   */
  async createPriceAlert(userId, asset, targetPrice, condition) {
    try {
      // Validate condition
      if (!['above', 'below'].includes(condition)) {
        return {
          success: false,
          error: 'Condition must be "above" or "below"'
        };
      }

      const result = await pool.query(
        `INSERT INTO price_alerts (
          user_id, asset, target_price, condition, status, created_at
        ) VALUES ($1, $2, $3, $4, 'active', NOW())
        RETURNING *`,
        [userId, asset, targetPrice, condition]
      );

      return {
        success: true,
        alert: result.rows[0],
        message: `Alert created: ${asset} ${condition} £${targetPrice}`
      };

    } catch (error) {
      console.error('Create price alert error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's active alerts
   */
  async getUserAlerts(userId, status = 'active') {
    try {
      const result = await pool.query(
        `SELECT * FROM price_alerts 
         WHERE user_id = $1 AND status = $2
         ORDER BY created_at DESC`,
        [userId, status]
      );

      return {
        success: true,
        alerts: result.rows
      };

    } catch (error) {
      console.error('Get user alerts error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete alert
   */
  async deleteAlert(userId, alertId) {
    try {
      const result = await pool.query(
        `DELETE FROM price_alerts 
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [alertId, userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Alert not found'
        };
      }

      return {
        success: true,
        message: 'Alert deleted'
      };

    } catch (error) {
      console.error('Delete alert error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create watchlist
   */
  async createWatchlist(userId, name, assets) {
    try {
      const result = await pool.query(
        `INSERT INTO watchlists (user_id, name, assets, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [userId, name, JSON.stringify(assets)]
      );

      return {
        success: true,
        watchlist: result.rows[0]
      };

    } catch (error) {
      console.error('Create watchlist error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's watchlists
   */
  async getUserWatchlists(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM watchlists 
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return {
        success: true,
        watchlists: result.rows.map(row => ({
          ...row,
          assets: JSON.parse(row.assets)
        }))
      };

    } catch (error) {
      console.error('Get watchlists error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start monitoring price alerts
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      console.log('Price alert monitoring already running');
      return;
    }

    console.log('🔔 Starting price alert monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      await this.checkAlerts();
    }, this.checkInterval);
  }

  /**
   * Check and trigger alerts
   */
  async checkAlerts() {
    try {
      const result = await pool.query(
        `SELECT * FROM price_alerts WHERE status = 'active'`
      );

      for (const alert of result.rows) {
        const priceData = await multiAssetService.getAssetPrice(alert.asset);
        
        if (!priceData.success) continue;

        const currentPrice = priceData.price;
        let triggered = false;

        if (alert.condition === 'above' && currentPrice >= alert.target_price) {
          triggered = true;
        } else if (alert.condition === 'below' && currentPrice <= alert.target_price) {
          triggered = true;
        }

        if (triggered) {
          await this.triggerAlert(alert, currentPrice);
        }
      }

    } catch (error) {
      console.error('Check alerts error:', error);
    }
  }

  /**
   * Trigger an alert
   */
  async triggerAlert(alert, currentPrice) {
    try {
      // Mark as triggered
      await pool.query(
        `UPDATE price_alerts 
         SET status = 'triggered', triggered_at = NOW(), triggered_price = $1
         WHERE id = $2`,
        [currentPrice, alert.id]
      );

      // Send notification
      await emailNotificationService.sendPriceAlert(
        alert.user_id,
        alert.asset,
        currentPrice,
        alert.target_price,
        alert.condition
      );

      console.log(`🔔 Alert #${alert.id} triggered: ${alert.asset} ${alert.condition} £${alert.target_price}`);

    } catch (error) {
      console.error('Trigger alert error:', error);
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏸️  Stopped price alert monitoring');
    }
  }
}

module.exports = new PriceAlertService();

