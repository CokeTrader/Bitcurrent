/**
 * Email Provider Integration (SendGrid/Mailgun)
 * Transactional email delivery
 */

const axios = require('axios');
const logger = require('../utils/logger');

class EmailProvider {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || process.env.MAILGUN_API_KEY;
    this.provider = process.env.EMAIL_PROVIDER || 'sendgrid';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@bitcurrent.com';
    this.fromName = 'BitCurrent';
  }

  /**
   * Send email via SendGrid
   */
  async sendViaSendGrid(to, subject, html, text) {
    try {
      await axios.post('https://api.sendgrid.com/v3/mail/send', {
        personalizations: [{
          to: [{ email: to }],
          subject
        }],
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        content: [
          { type: 'text/plain', value: text || '' },
          { type: 'text/html', value: html }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info('Email sent via SendGrid', { to, subject });
      return true;
    } catch (error) {
      logger.error('SendGrid send failed', { to, error: error.message });
      throw error;
    }
  }

  /**
   * Send email via Mailgun
   */
  async sendViaMailgun(to, subject, html, text) {
    try {
      const domain = process.env.MAILGUN_DOMAIN;
      const formData = new URLSearchParams();
      formData.append('from', `${this.fromName} <${this.fromEmail}>`);
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('html', html);
      if (text) formData.append('text', text);

      await axios.post(
        `https://api.mailgun.net/v3/${domain}/messages`,
        formData,
        {
          auth: {
            username: 'api',
            password: this.apiKey
          }
        }
      );

      logger.info('Email sent via Mailgun', { to, subject });
      return true;
    } catch (error) {
      logger.error('Mailgun send failed', { to, error: error.message });
      throw error;
    }
  }

  /**
   * Send email (auto-selects provider)
   */
  async send(to, subject, html, text) {
    if (this.provider === 'sendgrid') {
      return this.sendViaSendGrid(to, subject, html, text);
    } else if (this.provider === 'mailgun') {
      return this.sendViaMailgun(to, subject, html, text);
    } else {
      throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  /**
   * Send templated email
   */
  async sendTemplate(to, templateName, data) {
    const templates = {
      'welcome': {
        subject: 'Welcome to BitCurrent!',
        getHtml: (d) => `
          <h1>Welcome, ${d.name}!</h1>
          <p>Your £10 bonus is waiting!</p>
          <a href="${d.loginUrl}">Start Trading</a>
        `
      },
      'deposit-confirmed': {
        subject: 'Deposit Confirmed',
        getHtml: (d) => `
          <h1>Deposit Confirmed!</h1>
          <p>£${d.amount} ${d.currency} has been credited to your account.</p>
        `
      },
      'order-filled': {
        subject: 'Order Filled',
        getHtml: (d) => `
          <h1>Your Order Was Filled!</h1>
          <p>${d.side.toUpperCase()} ${d.amount} ${d.pair} @ £${d.price}</p>
        `
      }
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    return this.send(
      to,
      template.subject,
      template.getHtml(data),
      null
    );
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  async sendBulk(emails, subject, html) {
    const results = [];
    
    for (const email of emails) {
      try {
        await this.send(email, subject, html);
        results.push({ email, success: true });
        
        // Rate limit: 10 emails/second
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({ email, success: false, error: error.message });
      }
    }

    logger.info('Bulk email sent', {
      total: emails.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }
}

module.exports = new EmailProvider();

