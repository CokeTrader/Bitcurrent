/**
 * SMS Provider Integration (Twilio)
 * 2FA codes and security alerts via SMS
 */

const twilio = require('twilio');
const logger = require('../utils/logger');

class SMSProvider {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  /**
   * Send SMS
   */
  async send(to, message) {
    if (!this.client) {
      logger.warn('SMS provider not configured, skipping SMS');
      return false;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });

      logger.info('SMS sent', { to, sid: result.sid });
      return true;
    } catch (error) {
      logger.error('Failed to send SMS', { to, error: error.message });
      throw error;
    }
  }

  /**
   * Send 2FA code
   */
  async send2FACode(phoneNumber, code) {
    const message = `Your BitCurrent verification code is: ${code}. Valid for 10 minutes. Never share this code.`;
    return this.send(phoneNumber, message);
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(phoneNumber, alertType) {
    const message = `BitCurrent Security Alert: ${alertType}. If this wasn't you, secure your account immediately at bitcurrent.com/security`;
    return this.send(phoneNumber, message);
  }

  /**
   * Send withdrawal confirmation
   */
  async sendWithdrawalConfirmation(phoneNumber, amount, currency) {
    const message = `BitCurrent: Withdrawal of ${currency} ${amount} has been approved and is being processed.`;
    return this.send(phoneNumber, message);
  }
}

module.exports = new SMSProvider();

