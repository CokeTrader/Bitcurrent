/**
 * Fiat Gateway Service
 * On/off ramps for multiple currencies
 */

class FiatGatewayService {
  constructor() {
    this.supportedFiats = ['GBP', 'EUR', 'USD', 'CHF'];
    this.supportedMethods = ['bank_transfer', 'card', 'sepa', 'swift'];
  }

  async depositFiat(userId, currency, amount, method) {
    if (!this.supportedFiats.includes(currency)) {
      return { success: false, error: 'Currency not supported' };
    }

    const fees = {
      bank_transfer: 0,
      card: amount * 0.029, // 2.9%
      sepa: 1,
      swift: 15
    };

    const fee = fees[method] || 0;
    const netAmount = amount - fee;

    return {
      success: true,
      gross: amount,
      fee,
      net: netAmount,
      currency,
      estimatedTime: method === 'card' ? 'Instant' : '1-3 days'
    };
  }

  async withdrawFiat(userId, currency, amount, bankDetails) {
    const fee = currency === 'GBP' ? 1 : 15; // £1 for GBP, £15 for international
    const netAmount = amount - fee;

    return {
      success: true,
      gross: amount,
      fee,
      net: netAmount,
      currency,
      estimatedTime: '1-3 business days'
    };
  }

  async convertCurrency(userId, fromCurrency, toCurrency, amount) {
    const rates = { 'GBP-EUR': 1.17, 'GBP-USD': 1.27, 'EUR-USD': 1.08 };
    const pair = `${fromCurrency}-${toCurrency}`;
    const rate = rates[pair] || 1;
    const converted = amount * rate;

    return {
      success: true,
      from: { currency: fromCurrency, amount },
      to: { currency: toCurrency, amount: converted },
      rate,
      fee: converted * 0.001
    };
  }
}

module.exports = new FiatGatewayService();

