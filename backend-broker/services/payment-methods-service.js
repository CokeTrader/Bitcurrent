/**
 * Extended Payment Methods Service
 * 
 * Support for multiple payment options:
 * - Apple Pay
 * - Google Pay
 * - Bank transfers
 * - Debit/Credit cards (Stripe)
 * - Open Banking (UK)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../config/database');

class PaymentMethodsService {
  
  /**
   * Process Apple Pay deposit
   */
  async processApplePayDeposit(userId, amount, paymentToken) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'gbp',
        payment_method_types: ['card'],
        payment_method_data: {
          type: 'card',
          card: {
            token: paymentToken
          }
        },
        confirm: true,
        description: `BitCurrent deposit via Apple Pay - User ${userId}`,
        metadata: {
          userId: userId.toString(),
          paymentMethod: 'apple_pay'
        }
      });

      if (paymentIntent.status === 'succeeded') {
        await this.recordDeposit(userId, amount, 'apple_pay', paymentIntent.id);
        
        return {
          success: true,
          message: `Successfully deposited £${amount} via Apple Pay`,
          transactionId: paymentIntent.id
        };
      }

      return {
        success: false,
        error: 'Payment failed',
        status: paymentIntent.status
      };

    } catch (error) {
      console.error('Apple Pay deposit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process Google Pay deposit
   */
  async processGooglePayDeposit(userId, amount, paymentToken) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'gbp',
        payment_method_types: ['card'],
        payment_method_data: {
          type: 'card',
          card: {
            token: paymentToken
          }
        },
        confirm: true,
        description: `BitCurrent deposit via Google Pay - User ${userId}`,
        metadata: {
          userId: userId.toString(),
          paymentMethod: 'google_pay'
        }
      });

      if (paymentIntent.status === 'succeeded') {
        await this.recordDeposit(userId, amount, 'google_pay', paymentIntent.id);
        
        return {
          success: true,
          message: `Successfully deposited £${amount} via Google Pay`,
          transactionId: paymentIntent.id
        };
      }

      return {
        success: false,
        error: 'Payment failed',
        status: paymentIntent.status
      };

    } catch (error) {
      console.error('Google Pay deposit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initiate bank transfer deposit
   */
  async initiateBankTransfer(userId, amount) {
    try {
      // Generate unique reference
      const reference = `BC${userId}-${Date.now().toString(36).toUpperCase()}`;

      // Record pending deposit
      const result = await pool.query(
        `INSERT INTO deposits (
          user_id, amount, currency, payment_method, status, reference, created_at
        ) VALUES ($1, $2, 'GBP', 'bank_transfer', 'pending', $3, NOW())
        RETURNING id`,
        [userId, amount, reference]
      );

      // Bank details for user to transfer to
      const bankDetails = {
        accountName: 'BitCurrent Ltd',
        sortCode: '12-34-56',
        accountNumber: '12345678',
        reference: reference,
        amount: amount,
        important: 'Please include the reference in your transfer'
      };

      return {
        success: true,
        depositId: result.rows[0].id,
        bankDetails,
        message: 'Bank transfer initiated. Funds will be credited once received (1-3 business days)'
      };

    } catch (error) {
      console.error('Initiate bank transfer error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process Open Banking deposit (UK Faster Payments)
   */
  async processOpenBankingDeposit(userId, amount, bankId) {
    try {
      // This would integrate with TrueLayer or Plaid for UK Open Banking
      // For now, returning structure
      
      return {
        success: true,
        message: 'Open Banking integration coming soon',
        supportedBanks: [
          'Barclays',
          'HSBC',
          'Lloyds',
          'NatWest',
          'Santander',
          'Nationwide'
        ]
      };

    } catch (error) {
      console.error('Open Banking deposit error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record deposit in database
   */
  async recordDeposit(userId, amount, paymentMethod, externalId) {
    try {
      await pool.query(
        `INSERT INTO deposits (
          user_id, amount, currency, payment_method, status, external_id, created_at
        ) VALUES ($1, $2, 'GBP', $3, 'completed', $4, NOW())`,
        [userId, amount, paymentMethod, externalId]
      );

      await pool.query(
        'UPDATE users SET gbp_balance = gbp_balance + $1 WHERE id = $2',
        [amount, userId]
      );

      return { success: true };
    } catch (error) {
      console.error('Record deposit error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's payment methods
   */
  async getUserPaymentMethods(userId) {
    try {
      // Get Stripe payment methods
      const customer = await this.getOrCreateStripeCustomer(userId);
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card'
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year
          } : null
        }))
      };

    } catch (error) {
      console.error('Get payment methods error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get or create Stripe customer
   */
  async getOrCreateStripeCustomer(userId) {
    try {
      const user = await pool.query(
        'SELECT email, stripe_customer_id FROM users WHERE id = $1',
        [userId]
      );

      if (!user.rows[0]) {
        throw new Error('User not found');
      }

      const { email, stripe_customer_id } = user.rows[0];

      if (stripe_customer_id) {
        return await stripe.customers.retrieve(stripe_customer_id);
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: userId.toString()
        }
      });

      // Save customer ID
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customer.id, userId]
      );

      return customer;

    } catch (error) {
      console.error('Get/create Stripe customer error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentMethodsService();

