/**
 * Withdrawals Routes - Refactored with Service Layer
 */

const express = require('express');
const router = express.Router();
const { financialOperationAuth } = require('../middleware/advanced-auth');
const { smartCsrfProtection } = require('../middleware/csrf-protection');
const WithdrawalService = require('../services/withdrawal-service');
const logger = require('../utils/logger');

/**
 * POST /api/v1/withdrawals
 * Request withdrawal
 */
router.post('/',
  smartCsrfProtection,
  financialOperationAuth,
  async (req, res, next) => {
    try {
      const { amount, currency, destination } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          code: 'INVALID_AMOUNT'
        });
      }

      if (!currency) {
        return res.status(400).json({
          error: 'Currency required',
          code: 'CURRENCY_REQUIRED'
        });
      }

      if (!destination) {
        return res.status(400).json({
          error: 'Destination required',
          code: 'DESTINATION_REQUIRED'
        });
      }

      const withdrawal = await WithdrawalService.requestWithdrawal(
        req.userId,
        amount,
        currency,
        destination
      );

      res.status(201).json({
        success: true,
        withdrawal,
        message: 'Withdrawal request submitted. It will be reviewed within 24 hours.'
      });
    } catch (error) {
      logger.error('Withdrawal request failed', {
        userId: req.userId,
        error: error.message
      });

      if (error.message.includes('Insufficient balance')) {
        return res.status(400).json({
          error: error.message,
          code: 'INSUFFICIENT_BALANCE'
        });
      }

      if (error.message.includes('KYC')) {
        return res.status(403).json({
          error: error.message,
          code: 'KYC_REQUIRED'
        });
      }

      next(error);
    }
  }
);

/**
 * GET /api/v1/withdrawals
 * Get withdrawal history
 */
router.get('/',
  financialOperationAuth,
  async (req, res, next) => {
    try {
      const { status, limit, offset } = req.query;

      const withdrawals = await WithdrawalService.getWithdrawalHistory(req.userId, {
        status,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0
      });

      res.json({
        success: true,
        withdrawals,
        pagination: {
          limit: parseInt(limit) || 50,
          offset: parseInt(offset) || 0,
          hasMore: withdrawals.length === (parseInt(limit) || 50)
        }
      });
    } catch (error) {
      logger.error('Failed to fetch withdrawals', {
        userId: req.userId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/withdrawals/:withdrawalId
 * Get specific withdrawal
 */
router.get('/:withdrawalId',
  financialOperationAuth,
  async (req, res, next) => {
    try {
      const withdrawal = await WithdrawalService.getWithdrawalById(
        req.params.withdrawalId,
        req.userId
      );

      if (!withdrawal) {
        return res.status(404).json({
          error: 'Withdrawal not found',
          code: 'WITHDRAWAL_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        withdrawal
      });
    } catch (error) {
      logger.error('Failed to fetch withdrawal', {
        withdrawalId: req.params.withdrawalId,
        error: error.message
      });
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/withdrawals/:withdrawalId
 * Cancel pending withdrawal
 */
router.delete('/:withdrawalId',
  smartCsrfProtection,
  financialOperationAuth,
  async (req, res, next) => {
    try {
      const withdrawal = await WithdrawalService.getWithdrawalById(
        req.params.withdrawalId,
        req.userId
      );

      if (!withdrawal) {
        return res.status(404).json({
          error: 'Withdrawal not found',
          code: 'WITHDRAWAL_NOT_FOUND'
        });
      }

      if (withdrawal.status !== 'pending') {
        return res.status(400).json({
          error: 'Can only cancel pending withdrawals',
          code: 'CANNOT_CANCEL'
        });
      }

      // Use rejection flow to cancel (reason: user cancelled)
      await WithdrawalService.rejectWithdrawal(
        req.params.withdrawalId,
        req.userId,
        'Cancelled by user'
      );

      res.json({
        success: true,
        message: 'Withdrawal cancelled'
      });
    } catch (error) {
      logger.error('Failed to cancel withdrawal', {
        withdrawalId: req.params.withdrawalId,
        error: error.message
      });
      next(error);
    }
  }
);

module.exports = router;

