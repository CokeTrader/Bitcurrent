/**
 * Merchant Payment Gateway
 * Accept crypto payments for businesses
 */

class MerchantPaymentGateway {
  async createMerchantAccount(businessDetails) {
    return {
      success: true,
      merchant: {
        id: `MERCH_${Date.now()}`,
        apiKey: 'mk_live_xxx',
        supportedAssets: ['BTC', 'ETH', 'USDT'],
        settlementCurrency: 'GBP',
        fees: '0.5%'
      }
    };
  }

  async createPaymentLink(merchantId, amount, currency) {
    return {
      success: true,
      paymentLink: `https://pay.bitcurrent.co.uk/${merchantId}/${amount}`,
      qrCode: 'data:image/png;base64...'
    };
  }
}

module.exports = new MerchantPaymentGateway();

