/**
 * Email Notification Service
 * 
 * Comprehensive email notifications:
 * - Welcome emails
 * - Trade confirmations
 * - Deposit/withdrawal confirmations
 * - Price alerts
 * - Bot execution notifications
 * - Security alerts
 * - Weekly summaries
 */

const nodemailer = require('nodemailer');
const pool = require('../config/database');

class EmailNotificationService {
  constructor() {
    // Configure email transport (using SendGrid/Gmail/SMTP)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@bitcurrent.co.uk';
    this.fromName = 'BitCurrent';
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    try {
      const subject = 'Welcome to BitCurrent! 🚀';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to BitCurrent!</h1>
          <p>Hi ${user.email},</p>
          <p>Thank you for joining BitCurrent - the UK's leading cryptocurrency trading platform.</p>
          
          <h2>Get Started:</h2>
          <ul>
            <li>✅ Deposit funds via Stripe</li>
            <li>✅ Buy Bitcoin, Ethereum, and more</li>
            <li>✅ Set up automated trading bots</li>
            <li>✅ Follow top traders with copy trading</li>
          </ul>
          
          <a href="https://bitcurrent.co.uk/dashboard" 
             style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Go to Dashboard
          </a>
          
          <p>Need help? Contact us at support@bitcurrent.co.uk</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            BitCurrent - Making crypto trading simple<br>
            © 2025 BitCurrent. All rights reserved.
          </p>
        </div>
      `;

      await this.sendEmail(user.email, subject, html);
      
      return { success: true };
    } catch (error) {
      console.error('Send welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send trade confirmation email
   */
  async sendTradeConfirmation(userId, trade) {
    try {
      const user = await this.getUser(userId);
      if (!user) return { success: false, error: 'User not found' };

      const subject = `Trade Confirmation: ${trade.side.toUpperCase()} ${trade.symbol}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Trade Executed</h1>
          <p>Hi ${user.email},</p>
          <p>Your trade has been successfully executed:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td><strong>Type:</strong></td>
                <td>${trade.side.toUpperCase()}</td>
              </tr>
              <tr>
                <td><strong>Asset:</strong></td>
                <td>${trade.symbol}</td>
              </tr>
              <tr>
                <td><strong>Amount:</strong></td>
                <td>${trade.quantity} ${trade.symbol.split('-')[0]}</td>
              </tr>
              <tr>
                <td><strong>Price:</strong></td>
                <td>£${trade.price.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Total:</strong></td>
                <td>£${trade.total.toFixed(2)}</td>
              </tr>
              ${trade.pnl ? `
              <tr>
                <td><strong>P&L:</strong></td>
                <td style="color: ${trade.pnl > 0 ? '#10b981' : '#ef4444'};">
                  ${trade.pnl > 0 ? '+' : ''}£${trade.pnl.toFixed(2)}
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <a href="https://bitcurrent.co.uk/portfolio" 
             style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            View Portfolio
          </a>
        </div>
      `;

      await this.sendEmail(user.email, subject, html);
      
      return { success: true };
    } catch (error) {
      console.error('Send trade confirmation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send deposit confirmation email
   */
  async sendDepositConfirmation(userId, amount, currency = 'GBP') {
    try {
      const user = await this.getUser(userId);
      if (!user) return { success: false, error: 'User not found' };

      const subject = `Deposit Confirmed: ${currency} ${amount}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">✅ Deposit Confirmed</h1>
          <p>Hi ${user.email},</p>
          <p>Your deposit has been successfully processed:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0; color: #10b981;">${currency} ${amount}</h2>
          </div>
          
          <p>Your funds are now available for trading!</p>
          
          <a href="https://bitcurrent.co.uk/trade" 
             style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px;">
            Start Trading
          </a>
        </div>
      `;

      await this.sendEmail(user.email, subject, html);
      
      return { success: true };
    } catch (error) {
      console.error('Send deposit confirmation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send price alert email
   */
  async sendPriceAlert(userId, asset, currentPrice, targetPrice, condition) {
    try {
      const user = await this.getUser(userId);
      if (!user) return { success: false, error: 'User not found' };

      const subject = `🔔 Price Alert: ${asset} ${condition} ${currency}${targetPrice}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f59e0b;">🔔 Price Alert Triggered!</h1>
          <p>Hi ${user.email},</p>
          <p>Your price alert for <strong>${asset}</strong> has been triggered:</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td><strong>Asset:</strong></td>
                <td>${asset}</td>
              </tr>
              <tr>
                <td><strong>Condition:</strong></td>
                <td>${condition} £${targetPrice}</td>
              </tr>
              <tr>
                <td><strong>Current Price:</strong></td>
                <td>£${currentPrice}</td>
              </tr>
            </table>
          </div>
          
          <a href="https://bitcurrent.co.uk/trade/${asset}" 
             style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px;">
            Trade ${asset}
          </a>
        </div>
      `;

      await this.sendEmail(user.email, subject, html);
      
      return { success: true };
    } catch (error) {
      console.error('Send price alert error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send weekly summary email
   */
  async sendWeeklySummary(userId) {
    try {
      const user = await this.getUser(userId);
      if (!user) return { success: false, error: 'User not found' };

      // Get weekly stats
      const stats = await this.getWeeklyStats(userId);

      const subject = `📊 Your Weekly Trading Summary`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Weekly Summary</h1>
          <p>Hi ${user.email},</p>
          <p>Here's your trading activity for the past week:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td><strong>Total Trades:</strong></td>
                <td>${stats.totalTrades}</td>
              </tr>
              <tr>
                <td><strong>Winning Trades:</strong></td>
                <td>${stats.winningTrades}</td>
              </tr>
              <tr>
                <td><strong>Win Rate:</strong></td>
                <td>${stats.winRate}%</td>
              </tr>
              <tr>
                <td><strong>Total P&L:</strong></td>
                <td style="color: ${stats.totalPnL >= 0 ? '#10b981' : '#ef4444'};">
                  ${stats.totalPnL >= 0 ? '+' : ''}£${stats.totalPnL.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td><strong>Portfolio Value:</strong></td>
                <td>£${stats.portfolioValue.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <a href="https://bitcurrent.co.uk/analytics" 
             style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            View Full Report
          </a>
        </div>
      `;

      await this.sendEmail(user.email, subject, html);
      
      return { success: true };
    } catch (error) {
      console.error('Send weekly summary error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bot execution notification
   */
  async sendBotNotification(userId, botName, action, details) {
    try {
      const user = await this.getUser(userId);
      if (!user) return { success: false, error: 'User not found' };

      const subject = `🤖 Bot Alert: ${botName} - ${action}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">🤖 Bot Activity</h1>
          <p>Hi ${user.email},</p>
          <p>Your trading bot <strong>${botName}</strong> ${action}:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <pre style="margin: 0;">${JSON.stringify(details, null, 2)}</pre>
          </div>
          
          <a href="https://bitcurrent.co.uk/bots" 
             style="display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px;">
            Manage Bots
          </a>
        </div>
      `;

      await this.sendEmail(user.email, subject, html);
      
      return { success: true };
    } catch (error) {
      console.error('Send bot notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Core email sending function
   */
  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html
      });

      console.log('Email sent:', info.messageId);
      
      // Log to database
      await pool.query(
        `INSERT INTO email_logs (recipient, subject, sent_at, status)
         VALUES ($1, $2, NOW(), 'sent')`,
        [to, subject]
      );

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Send email error:', error);
      
      // Log failed email
      await pool.query(
        `INSERT INTO email_logs (recipient, subject, sent_at, status, error)
         VALUES ($1, $2, NOW(), 'failed', $3)`,
        [to, subject, error.message]
      );

      throw error;
    }
  }

  /**
   * Helper: Get user
   */
  async getUser(userId) {
    const result = await pool.query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Helper: Get weekly stats
   */
  async getWeeklyStats(userId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(pnl) as total_pnl
       FROM trades
       WHERE user_id = $1
       AND created_at >= NOW() - INTERVAL '7 days'`,
      [userId]
    );

    const stats = result.rows[0];
    const totalTrades = parseInt(stats.total_trades || 0);
    const winningTrades = parseInt(stats.winning_trades || 0);

    return {
      totalTrades,
      winningTrades,
      winRate: totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : 0,
      totalPnL: parseFloat(stats.total_pnl || 0),
      portfolioValue: 0 // Would fetch from portfolio service
    };
  }
}

module.exports = new EmailNotificationService();

