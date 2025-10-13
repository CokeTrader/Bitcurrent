/**
 * Google Pay Integration  
 * Accept Google Pay for instant deposits
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

class GooglePayIntegration {
  /**
   * Create Google Pay payment intent
   */
  static async createPaymentIntent(userId, amount, currency = 'GBP') {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        payment_method_types: ['card', 'google_pay'],
        metadata: {
          userId: userId.toString(),
          type: 'deposit'
        }
      });

      logger.info('Google Pay intent created', {
        userId,
        intentId: paymentIntent.id,
        amount
      });

      return {
        clientSecret: paymentIntent.client_secret,
        intentId: paymentIntent.id
      };
    } catch (error) {
      logger.error('Failed to create Google Pay intent', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get Google Pay merchant info
   */
  static getMerchantInfo() {
    return {
      merchantId: process.env.GOOGLE_PAY_MERCHANT_ID || '12345678901234567890',
      merchantName: 'BitCurrent',
      merchantOrigin: process.env.FRONTEND_URL || 'https://bitcurrent.com'
    };
  }

  /**
   * Check if Google Pay is available
   */
  static isGooglePayAvailable(userAgent) {
    // Google Pay available on:
    // - Chrome on Android
    // - Chrome on desktop (with saved cards)
    const isChrome = /Chrome/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    return isChrome; // Available on all Chrome browsers
  }

  /**
   * Get allowed payment methods for Google Pay
   */
  static getAllowedPaymentMethods() {
    return [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['MASTERCARD', 'VISA']
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'stripe',
            'stripe:version': '2023-10-16',
            'stripe:publishableKey': process.env.STRIPE_PUBLIC_KEY
          }
        }
      }
    ];
  }
}

module.exports = GooglePayIntegration;

