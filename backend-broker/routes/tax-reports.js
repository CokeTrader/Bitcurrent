/**
 * Tax Reporting API Routes
 */

const express = require('express');
const router = express.Router();
const taxReportingService = require('../services/tax-reporting-service');
const { authenticateToken } = require('../middleware/api-auth');

router.use(authenticateToken);

/**
 * GET /api/v1/tax/report/:taxYear
 * Generate complete tax report for a tax year
 * Example: /api/v1/tax/report/2024
 */
router.get('/report/:taxYear', async (req, res) => {
  try {
    const userId = req.user.id;
    const { taxYear } = req.params;

    if (!taxYear || !/^\d{4}$/.test(taxYear)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tax year format. Use YYYY (e.g., 2024)'
      });
    }

    const result = await taxReportingService.generateTaxReport(userId, taxYear);
    res.json(result);
  } catch (error) {
    console.error('Generate tax report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate tax report'
    });
  }
});

/**
 * GET /api/v1/tax/export-csv/:taxYear
 * Export tax report as HMRC-compatible CSV
 */
router.get('/export-csv/:taxYear', async (req, res) => {
  try {
    const userId = req.user.id;
    const { taxYear } = req.params;

    if (!taxYear || !/^\d{4}$/.test(taxYear)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tax year format. Use YYYY (e.g., 2024)'
      });
    }

    const result = await taxReportingService.exportToCSV(userId, taxYear);

    if (result.success) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.csv);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export tax report'
    });
  }
});

/**
 * GET /api/v1/tax/transactions
 * Export all transactions for accountant
 * Query params: startDate, endDate (YYYY-MM-DD format)
 */
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters required (YYYY-MM-DD)'
      });
    }

    const result = await taxReportingService.exportTransactionsForAccountant(
      userId,
      startDate,
      endDate
    );

    if (result.success) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.csv);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Export transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export transactions'
    });
  }
});

/**
 * GET /api/v1/tax/disposals
 * Get all disposals (sales) for a period
 */
router.get('/disposals', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters required'
      });
    }

    const disposals = await taxReportingService.getDisposals(userId, startDate, endDate);
    
    res.json({
      success: true,
      disposals
    });
  } catch (error) {
    console.error('Get disposals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve disposals'
    });
  }
});

/**
 * GET /api/v1/tax/acquisitions
 * Get all acquisitions (purchases) for a period
 */
router.get('/acquisitions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query parameters required'
      });
    }

    const acquisitions = await taxReportingService.getAcquisitions(userId, startDate, endDate);
    
    res.json({
      success: true,
      acquisitions
    });
  } catch (error) {
    console.error('Get acquisitions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve acquisitions'
    });
  }
});

module.exports = router;

