/**
 * Apple Pay Integration
 * Accept Apple Pay for instant deposits
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

class ApplePayIntegration {
  /**
   * Create Apple Pay payment intent
   */
  static async createPaymentIntent(userId, amount, currency = 'GBP') {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        payment_method_types: ['card', 'apple_pay'],
        metadata: {
          userId: userId.toString(),
          type: 'deposit'
        }
      });

      logger.info('Apple Pay intent created', {
        userId,
        intentId: paymentIntent.id,
        amount
      });

      return {
        clientSecret: paymentIntent.client_secret,
        intentId: paymentIntent.id
      };
    } catch (error) {
      logger.error('Failed to create Apple Pay intent', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verify Apple Pay domain (required by Apple)
   */
  static async verifyDomain(domain) {
    try {
      // Download domain verification file from Stripe
      const file = await stripe.applePayDomains.create({
        domain_name: domain
      });

      logger.info('Apple Pay domain registered', { domain });
      return file;
    } catch (error) {
      logger.error('Failed to verify Apple Pay domain', {
        domain,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Check if Apple Pay is available for user
   */
  static isApplePayAvailable(userAgent) {
    // Apple Pay available on:
    // - Safari on iOS/macOS
    // - Chrome/Edge on macOS with TouchID
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isMac = /Mac/.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(userAgent);

    return (isSafari && (isMac || isIOS)) || (isMac && /Chrome|Edg/.test(userAgent));
  }
}

module.exports = ApplePayIntegration;

