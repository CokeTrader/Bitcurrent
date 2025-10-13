/**
 * Crypto Rewards Card
 * Earn crypto on everyday purchases
 */

class CryptoRewardsCard {
  async issueCryptoCard(userId, tier) {
    const tiers = {
      basic: { cashback: 1, annual_fee: 0 },
      premium: { cashback: 2, annual_fee: 99 },
      platinum: { cashback: 3, annual_fee: 299 }
    };

    return {
      success: true,
      card: {
        tier,
        cashback: `${tiers[tier].cashback}% in BTC`,
        annualFee: `£${tiers[tier].annual_fee}`
      }
    };
  }

  async processRewards(userId, purchaseAmount) {
    const cashback = purchaseAmount * 0.02;

    return {
      success: true,
      rewards: {
        earned: `${cashback} GBP worth of BTC`,
        totalLifetime: 245.50
      }
    };
  }
}

module.exports = new CryptoRewardsCard();

