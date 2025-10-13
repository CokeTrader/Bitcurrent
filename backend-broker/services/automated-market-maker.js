/**
 * Automated Market Maker (AMM)
 * Constant product formula
 */

class AutomatedMarketMaker {
  calculateSwapOutput(inputAmount, inputReserve, outputReserve, fee = 0.003) {
    const inputWithFee = inputAmount * (1 - fee);
    const numerator = inputWithFee * outputReserve;
    const denominator = inputReserve + inputWithFee;
    
    return numerator / denominator;
  }

  calculatePriceImpact(inputAmount, inputReserve, outputReserve) {
    const output = this.calculateSwapOutput(inputAmount, inputReserve, outputReserve);
    const expectedOutput = inputAmount * (outputReserve / inputReserve);
    const impact = ((expectedOutput - output) / expectedOutput) * 100;

    return {
      success: true,
      impact: impact.toFixed(2) + '%',
      warning: impact > 5 ? 'High slippage' : null
    };
  }
}

module.exports = new AutomatedMarketMaker();

