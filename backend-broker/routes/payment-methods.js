/**
 * Payment Methods API Routes
 */

const express = require('express');
const router = express.Router();
const paymentMethodsService = require('../services/payment-methods-service');
const { authenticateToken } = require('../middleware/api-auth');

router.use(authenticateToken);

/**
 * POST /api/v1/payment-methods/apple-pay
 * Deposit via Apple Pay
 */
router.post('/apple-pay', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentToken } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum deposit is £10'
      });
    }

    const result = await paymentMethodsService.processApplePayDeposit(
      userId,
      amount,
      paymentToken
    );

    res.json(result);
  } catch (error) {
    console.error('Apple Pay error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Apple Pay payment'
    });
  }
});

/**
 * POST /api/v1/payment-methods/google-pay
 * Deposit via Google Pay
 */
router.post('/google-pay', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentToken } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum deposit is £10'
      });
    }

    const result = await paymentMethodsService.processGooglePayDeposit(
      userId,
      amount,
      paymentToken
    );

    res.json(result);
  } catch (error) {
    console.error('Google Pay error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process Google Pay payment'
    });
  }
});

/**
 * POST /api/v1/payment-methods/bank-transfer
 * Initiate bank transfer
 */
router.post('/bank-transfer', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        error: 'Minimum deposit is £10'
      });
    }

    const result = await paymentMethodsService.initiateBankTransfer(userId, amount);
    res.json(result);
  } catch (error) {
    console.error('Bank transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate bank transfer'
    });
  }
});

/**
 * GET /api/v1/payment-methods
 * Get user's saved payment methods
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await paymentMethodsService.getUserPaymentMethods(userId);
    res.json(result);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment methods'
    });
  }
});

module.exports = router;

