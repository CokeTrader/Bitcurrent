/**
 * Notification Service
 * Send email, SMS, and push notifications
 */

const logger = require('../utils/logger');
const EmailService = require('../utils/email-service');

class NotificationService {
  /**
   * Send price alert notification
   */
  static async sendPriceAlert(userId, pair, currentPrice, targetPrice, direction) {
    try {
      await EmailService.send(userId, {
        subject: `Price Alert: ${pair} ${direction === 'above' ? '↑' : '↓'} £${targetPrice}`,
        template: 'price-alert',
        data: {
          pair,
          currentPrice,
          targetPrice,
          direction
        }
      });

      logger.info('Price alert sent', { userId, pair, currentPrice, targetPrice });
    } catch (error) {
      logger.error('Failed to send price alert', { userId, error: error.message });
    }
  }

  /**
   * Send order filled notification
   */
  static async sendOrderFilled(userId, order) {
    try {
      await EmailService.send(userId, {
        subject: `Order Filled: ${order.side.toUpperCase()} ${order.amount} ${order.pair}`,
        template: 'order-filled',
        data: order
      });

      logger.info('Order filled notification sent', { userId, orderId: order.id });
    } catch (error) {
      logger.error('Failed to send order notification', { userId, error: error.message });
    }
  }

  /**
   * Send large trade alert
   */
  static async sendLargeTradeAlert(userId, order) {
    try {
      if (order.amount * order.price > 10000) {
        await EmailService.send(userId, {
          subject: `Large Trade Executed: £${(order.amount * order.price).toLocaleString()}`,
          template: 'large-trade',
          data: order
        });

        logger.info('Large trade alert sent', { userId, orderId: order.id });
      }
    } catch (error) {
      logger.error('Failed to send large trade alert', { userId, error: error.message });
    }
  }

  /**
   * Send security alert
   */
  static async sendSecurityAlert(userId, alertType, details) {
    try {
      await EmailService.send(userId, {
        subject: `Security Alert: ${alertType}`,
        template: 'security-alert',
        data: {
          alertType,
          details,
          timestamp: new Date()
        }
      });

      logger.warn('Security alert sent', { userId, alertType, details });
    } catch (error) {
      logger.error('Failed to send security alert', { userId, error: error.message });
    }
  }

  /**
   * Send daily summary
   */
  static async sendDailySummary(userId, summary) {
    try {
      await EmailService.send(userId, {
        subject: 'Your Daily Trading Summary',
        template: 'daily-summary',
        data: summary
      });

      logger.info('Daily summary sent', { userId });
    } catch (error) {
      logger.error('Failed to send daily summary', { userId, error: error.message });
    }
  }

  /**
   * Send margin call warning
   */
  static async sendMarginCallWarning(userId, position) {
    try {
      await EmailService.send(userId, {
        subject: '⚠️ Margin Call Warning',
        template: 'margin-call',
        data: position
      });

      logger.warn('Margin call warning sent', { userId, position });
    } catch (error) {
      logger.error('Failed to send margin call', { userId, error: error.message });
    }
  }
}

module.exports = NotificationService;

