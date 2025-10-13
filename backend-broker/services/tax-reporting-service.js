/**
 * Tax Reporting Service
 * 
 * UK-compliant tax reporting for cryptocurrency trades:
 * - Capital Gains Tax (CGT) calculations
 * - Same-day rule
 * - 30-day rule (bed and breakfasting)
 * - Section 104 holding calculations
 * - HMRC-compatible CSV exports
 * - Annual tax summaries
 */

const pool = require('../config/database');

class TaxReportingService {
  
  /**
   * Generate complete tax report for a tax year
   * UK tax year: April 6th - April 5th
   */
  async generateTaxReport(userId, taxYear) {
    try {
      // Calculate tax year dates
      const startDate = `${taxYear}-04-06`;
      const endDate = `${parseInt(taxYear) + 1}-04-05`;

      const [
        disposals,
        acquisitions,
        capitalGains,
        summary
      ] = await Promise.all([
        this.getDisposals(userId, startDate, endDate),
        this.getAcquisitions(userId, startDate, endDate),
        this.calculateCapitalGains(userId, startDate, endDate),
        this.getTaxSummary(userId, startDate, endDate)
      ]);

      return {
        success: true,
        taxReport: {
          taxYear: `${taxYear}/${parseInt(taxYear) + 1}`,
          startDate,
          endDate,
          disposals,
          acquisitions,
          capitalGains,
          summary,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Generate tax report error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all disposals (sales) in tax year
   */
  async getDisposals(userId, startDate, endDate) {
    try {
      const result = await pool.query(
        `SELECT 
          id,
          symbol,
          quantity as amount,
          price as disposal_price,
          total as disposal_proceeds,
          created_at as disposal_date
         FROM trades
         WHERE user_id = $1
         AND side = 'sell'
         AND created_at >= $2
         AND created_at <= $3
         ORDER BY created_at`,
        [userId, startDate, endDate]
      );

      return result.rows.map(row => ({
        id: row.id,
        asset: row.symbol.split('-')[0], // e.g., 'BTC-GBP' -> 'BTC'
        amount: parseFloat(row.amount),
        disposalPrice: parseFloat(row.disposal_price),
        disposalProceeds: parseFloat(row.disposal_proceeds),
        disposalDate: row.disposal_date
      }));

    } catch (error) {
      console.error('Get disposals error:', error);
      return [];
    }
  }

  /**
   * Get all acquisitions (purchases) in tax year
   */
  async getAcquisitions(userId, startDate, endDate) {
    try {
      const result = await pool.query(
        `SELECT 
          id,
          symbol,
          quantity as amount,
          price as acquisition_price,
          total as acquisition_cost,
          created_at as acquisition_date
         FROM trades
         WHERE user_id = $1
         AND side = 'buy'
         AND created_at >= $2
         AND created_at <= $3
         ORDER BY created_at`,
        [userId, startDate, endDate]
      );

      return result.rows.map(row => ({
        id: row.id,
        asset: row.symbol.split('-')[0],
        amount: parseFloat(row.amount),
        acquisitionPrice: parseFloat(row.acquisition_price),
        acquisitionCost: parseFloat(row.acquisition_cost),
        acquisitionDate: row.acquisition_date
      }));

    } catch (error) {
      console.error('Get acquisitions error:', error);
      return [];
    }
  }

  /**
   * Calculate capital gains using UK HMRC rules
   * Implements same-day rule, 30-day rule, and Section 104 holding
   */
  async calculateCapitalGains(userId, startDate, endDate) {
    try {
      const disposals = await this.getDisposals(userId, startDate, endDate);
      const allAcquisitions = await this.getAllAcquisitions(userId, endDate);

      const capitalGains = [];

      for (const disposal of disposals) {
        // Step 1: Same-day rule - match with acquisitions on same day
        const sameDayAcquisitions = allAcquisitions.filter(acq =>
          acq.asset === disposal.asset &&
          this.isSameDay(acq.acquisitionDate, disposal.disposalDate) &&
          !acq.matched
        );

        // Step 2: 30-day rule - match with acquisitions within 30 days after disposal
        const thirtyDayAcquisitions = allAcquisitions.filter(acq =>
          acq.asset === disposal.asset &&
          this.isWithin30Days(disposal.disposalDate, acq.acquisitionDate) &&
          !acq.matched
        );

        // Step 3: Section 104 holding - match with earlier acquisitions (FIFO)
        const section104Acquisitions = allAcquisitions.filter(acq =>
          acq.asset === disposal.asset &&
          new Date(acq.acquisitionDate) < new Date(disposal.disposalDate) &&
          !acq.matched
        ).sort((a, b) => new Date(a.acquisitionDate) - new Date(b.acquisitionDate));

        // Calculate gain for this disposal
        const gain = this.calculateGainForDisposal(
          disposal,
          sameDayAcquisitions,
          thirtyDayAcquisitions,
          section104Acquisitions
        );

        capitalGains.push(gain);
      }

      return capitalGains;

    } catch (error) {
      console.error('Calculate capital gains error:', error);
      return [];
    }
  }

  /**
   * Calculate gain for a single disposal
   */
  calculateGainForDisposal(disposal, sameDayAcq, thirtyDayAcq, section104Acq) {
    let remainingAmount = disposal.amount;
    let totalCost = 0;
    const matches = [];

    // Apply same-day rule
    for (const acq of sameDayAcq) {
      if (remainingAmount <= 0) break;
      
      const matchAmount = Math.min(remainingAmount, acq.amount);
      const matchCost = (acq.acquisitionCost / acq.amount) * matchAmount;
      
      totalCost += matchCost;
      remainingAmount -= matchAmount;
      acq.matched = true;
      
      matches.push({
        rule: 'same-day',
        amount: matchAmount,
        cost: matchCost,
        acquisitionDate: acq.acquisitionDate
      });
    }

    // Apply 30-day rule
    for (const acq of thirtyDayAcq) {
      if (remainingAmount <= 0) break;
      
      const matchAmount = Math.min(remainingAmount, acq.amount);
      const matchCost = (acq.acquisitionCost / acq.amount) * matchAmount;
      
      totalCost += matchCost;
      remainingAmount -= matchAmount;
      acq.matched = true;
      
      matches.push({
        rule: '30-day',
        amount: matchAmount,
        cost: matchCost,
        acquisitionDate: acq.acquisitionDate
      });
    }

    // Apply Section 104 holding
    for (const acq of section104Acq) {
      if (remainingAmount <= 0) break;
      
      const matchAmount = Math.min(remainingAmount, acq.amount);
      const matchCost = (acq.acquisitionCost / acq.amount) * matchAmount;
      
      totalCost += matchCost;
      remainingAmount -= matchAmount;
      acq.matched = true;
      
      matches.push({
        rule: 'section-104',
        amount: matchAmount,
        cost: matchCost,
        acquisitionDate: acq.acquisitionDate
      });
    }

    const gain = disposal.disposalProceeds - totalCost;

    return {
      disposalId: disposal.id,
      asset: disposal.asset,
      disposalDate: disposal.disposalDate,
      disposalAmount: disposal.amount,
      disposalProceeds: disposal.disposalProceeds,
      allowableCost: totalCost,
      capitalGain: gain,
      matches
    };
  }

  /**
   * Get all acquisitions up to a date (for Section 104)
   */
  async getAllAcquisitions(userId, endDate) {
    try {
      const result = await pool.query(
        `SELECT 
          id,
          symbol,
          quantity as amount,
          total as acquisition_cost,
          created_at as acquisition_date
         FROM trades
         WHERE user_id = $1
         AND side = 'buy'
         AND created_at <= $2
         ORDER BY created_at`,
        [userId, endDate]
      );

      return result.rows.map(row => ({
        id: row.id,
        asset: row.symbol.split('-')[0],
        amount: parseFloat(row.amount),
        acquisitionCost: parseFloat(row.acquisition_cost),
        acquisitionDate: row.acquisition_date,
        matched: false
      }));

    } catch (error) {
      console.error('Get all acquisitions error:', error);
      return [];
    }
  }

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  }

  /**
   * Check if acq is within 30 days after disposal
   */
  isWithin30Days(disposalDate, acquisitionDate) {
    const disposal = new Date(disposalDate);
    const acquisition = new Date(acquisitionDate);
    const diffDays = (acquisition - disposal) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 30;
  }

  /**
   * Get tax summary for the year
   */
  async getTaxSummary(userId, startDate, endDate) {
    try {
      const capitalGains = await this.calculateCapitalGains(userId, startDate, endDate);
      
      const totalGains = capitalGains.reduce((sum, cg) => sum + cg.capitalGain, 0);
      const totalLosses = capitalGains.filter(cg => cg.capitalGain < 0)
        .reduce((sum, cg) => sum + Math.abs(cg.capitalGain), 0);
      const netGain = totalGains - totalLosses;

      // UK CGT allowance for 2024/25: £3,000
      const cgtAllowance = 3000;
      const taxableGain = Math.max(0, netGain - cgtAllowance);

      // CGT rates: 10% basic rate, 20% higher rate
      // Assuming basic rate for calculation
      const estimatedTax = taxableGain * 0.10;

      return {
        totalDisposals: capitalGains.length,
        totalGains: totalGains.toFixed(2),
        totalLosses: totalLosses.toFixed(2),
        netGain: netGain.toFixed(2),
        cgtAllowance: cgtAllowance.toFixed(2),
        taxableGain: taxableGain.toFixed(2),
        estimatedTax: estimatedTax.toFixed(2),
        notes: [
          'CGT allowance: £3,000 (2024/25 tax year)',
          'Basic rate CGT: 10%',
          'Higher rate CGT: 20%',
          'This is an estimate. Consult a tax professional.'
        ]
      };

    } catch (error) {
      console.error('Get tax summary error:', error);
      return null;
    }
  }

  /**
   * Export to HMRC-compatible CSV
   */
  async exportToCSV(userId, taxYear) {
    try {
      const report = await this.generateTaxReport(userId, taxYear);
      
      if (!report.success) {
        return report;
      }

      const lines = [];
      
      // Header
      lines.push('BitCurrent - HMRC Capital Gains Tax Report');
      lines.push(`Tax Year,${report.taxReport.taxYear}`);
      lines.push(`Generated,${report.taxReport.generatedAt}`);
      lines.push('');
      
      // Summary
      lines.push('TAX SUMMARY');
      const summary = report.taxReport.summary;
      lines.push(`Total Disposals,${summary.totalDisposals}`);
      lines.push(`Total Gains,£${summary.totalGains}`);
      lines.push(`Total Losses,£${summary.totalLosses}`);
      lines.push(`Net Gain,£${summary.netGain}`);
      lines.push(`CGT Allowance,£${summary.cgtAllowance}`);
      lines.push(`Taxable Gain,£${summary.taxableGain}`);
      lines.push(`Estimated Tax,£${summary.estimatedTax}`);
      lines.push('');
      
      // Disposals detail
      lines.push('DISPOSALS');
      lines.push('Asset,Date,Amount,Proceeds,Cost,Gain/Loss');
      
      report.taxReport.capitalGains.forEach(cg => {
        lines.push(
          `${cg.asset},${cg.disposalDate},${cg.disposalAmount},` +
          `£${cg.disposalProceeds.toFixed(2)},£${cg.allowableCost.toFixed(2)},` +
          `£${cg.capitalGain.toFixed(2)}`
        );
      });
      
      lines.push('');
      lines.push('DISCLAIMER');
      lines.push('This report is for informational purposes only.');
      lines.push('Please consult a qualified tax professional for advice.');

      return {
        success: true,
        csv: lines.join('\n'),
        filename: `bitcurrent_tax_report_${taxYear}.csv`
      };

    } catch (error) {
      console.error('Export to CSV error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export all transactions for accountant
   */
  async exportTransactionsForAccountant(userId, startDate, endDate) {
    try {
      const result = await pool.query(
        `SELECT 
          created_at as date,
          symbol as asset_pair,
          side,
          quantity as amount,
          price,
          total,
          pnl,
          status,
          exchange
         FROM trades
         WHERE user_id = $1
         AND created_at >= $2
         AND created_at <= $3
         ORDER BY created_at`,
        [userId, startDate, endDate]
      );

      const lines = [];
      lines.push('Date,Asset,Side,Amount,Price,Total (GBP),PnL,Status,Exchange');
      
      result.rows.forEach(row => {
        lines.push(
          `${row.date},${row.asset_pair},${row.side},${row.amount},` +
          `${row.price},${row.total},${row.pnl || 0},${row.status},${row.exchange || 'N/A'}`
        );
      });

      return {
        success: true,
        csv: lines.join('\n'),
        filename: `bitcurrent_transactions_${startDate}_${endDate}.csv`
      };

    } catch (error) {
      console.error('Export transactions error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new TaxReportingService();

