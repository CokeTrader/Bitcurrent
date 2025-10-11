// FAQ Data for BitCurrent Exchange
// Optimized for SEO with FAQPage schema markup

export interface FAQItem {
  question: string
  answer: string
  category: 'getting-started' | 'trading' | 'security' | 'fees' | 'legal' | 'staking'
}

export const faqData: FAQItem[] = [
  // Getting Started
  {
    question: "How do I buy Bitcoin in the UK?",
    answer: "To buy Bitcoin in the UK on BitCurrent: 1) Create a free account at bitcurrent.co.uk, 2) Complete identity verification (KYC) which takes 5-10 minutes, 3) Deposit GBP via instant bank transfer or debit card, 4) Navigate to the BTC/GBP trading pair, 5) Place a market or limit order. Your Bitcoin is immediately stored in secure cold storage (95% offline) with £85,000 FSCS insurance protection.",
    category: 'getting-started'
  },
  {
    question: "Is BitCurrent regulated in the UK?",
    answer: "Yes, BitCurrent is FCA regulated and registered as a cryptoasset business in the United Kingdom. We comply with all UK anti-money laundering (AML) and know-your-customer (KYC) regulations. Your funds are protected with £85,000 FSCS insurance coverage, the same protection as traditional UK banks.",
    category: 'legal'
  },
  {
    question: "How long does it take to verify my account?",
    answer: "Account verification (KYC) typically takes 5-15 minutes. You'll need to provide a valid UK photo ID (passport or driving license) and proof of address. Most accounts are verified instantly using our automated ID verification system. In rare cases requiring manual review, verification may take up to 24 hours.",
    category: 'getting-started'
  },
  {
    question: "What payment methods can I use to deposit GBP?",
    answer: "BitCurrent accepts multiple GBP deposit methods: Faster Payments (instant, free), Bank Transfer (1-2 hours, free), Debit Card (instant, 1.5% fee), and Credit Card (instant, 2.5% fee). We recommend Faster Payments for instant, fee-free deposits. All deposits are in GBP and there are no minimum deposit requirements.",
    category: 'getting-started'
  },
  {
    question: "What are BitCurrent's trading fees?",
    answer: "BitCurrent offers transparent, low-cost trading fees: 0.1% maker fee, 0.15% taker fee. High-volume traders receive discounts down to 0.05%. There are no deposit fees for bank transfers, no withdrawal fees for crypto (only network gas fees), and GBP withdrawals are free for amounts over £100. No hidden charges.",
    category: 'fees'
  },
  {
    question: "Is my cryptocurrency safe on BitCurrent?",
    answer: "Yes. BitCurrent implements bank-grade security: 95% of crypto assets are stored in cold storage (offline wallets), all hot wallets use multi-signature authentication, funds are insured up to £85,000 per account, we undergo regular third-party security audits, and employ 24/7 monitoring for suspicious activity. We've never been hacked.",
    category: 'security'
  },
  {
    question: "How long do withdrawals take?",
    answer: "Cryptocurrency withdrawals are processed within 1 hour (usually 10-30 minutes) and confirmed based on blockchain speed. GBP withdrawals via Faster Payments arrive within 2 hours, bank transfers take 1-2 business days. Large withdrawals may require additional security verification.",
    category: 'trading'
  },
  {
    question: "What cryptocurrencies can I trade on BitCurrent?",
    answer: "BitCurrent offers 100+ cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Binance Coin (BNB), Solana (SOL), XRP, Cardano (ADA), Dogecoin (DOGE), Polygon (MATIC), and many more. All pairs are traded against GBP for easy UK access. New cryptocurrencies are added regularly based on demand and security audits.",
    category: 'trading'
  },
  {
    question: "Do I need to pay tax on cryptocurrency in the UK?",
    answer: "Yes. In the UK, cryptocurrency is subject to Capital Gains Tax when you sell, trade, or use crypto to buy goods. You have a £12,300 tax-free allowance (2025/26). BitCurrent provides detailed transaction history and tax reports compatible with HMRC requirements. We recommend consulting a tax professional for personalized advice.",
    category: 'legal'
  },
  {
    question: "What is crypto staking and how do I earn rewards?",
    answer: "Crypto staking allows you to earn passive income by locking your cryptocurrency to support blockchain networks. On BitCurrent, you can stake Ethereum (5-6% APY), Solana (7-8% APY), Cardano (4-5% APY), and others. Rewards are paid daily. Choose flexible staking (withdraw anytime) or locked staking (higher APY, fixed term).",
    category: 'staking'
  },
  {
    question: "What's the minimum amount to start trading?",
    answer: "There is no minimum deposit requirement on BitCurrent. You can start with as little as £10. However, we recommend starting with at least £100 to account for trading fees and market volatility. This allows you to build a diversified crypto portfolio across multiple assets.",
    category: 'getting-started'
  },
  {
    question: "How do I withdraw GBP from BitCurrent?",
    answer: "To withdraw GBP: 1) Navigate to your wallet, 2) Click 'Withdraw' and select GBP, 3) Enter your UK bank details (verified during KYC), 4) Enter the amount (minimum £10), 5) Confirm withdrawal. Withdrawals via Faster Payments arrive in 2 hours, free for amounts over £100.",
    category: 'trading'
  },
  {
    question: "Can I use BitCurrent on my mobile phone?",
    answer: "Yes! BitCurrent is fully mobile-optimized and works perfectly on any smartphone or tablet. We also offer a Progressive Web App (PWA) that you can install on your phone for a native app experience. iOS and Android dedicated apps are coming soon.",
    category: 'getting-started'
  },
  {
    question: "What is the difference between market and limit orders?",
    answer: "A market order executes immediately at the current market price, guaranteeing your trade fills but not the exact price. A limit order lets you set your desired price—it only executes when the market reaches that price. Use market orders for instant trades, limit orders for better price control.",
    category: 'trading'
  },
  {
    question: "Does BitCurrent offer customer support?",
    answer: "Yes. BitCurrent provides 24/7 customer support via live chat (in-app), email (support@bitcurrent.co.uk), and a comprehensive help center. Average response time is under 5 minutes for chat, 2 hours for email. Premium users get priority support with dedicated account managers.",
    category: 'getting-started'
  },
  {
    question: "What is two-factor authentication (2FA) and should I enable it?",
    answer: "Two-factor authentication (2FA) adds an extra security layer by requiring a code from your phone in addition to your password when logging in. We strongly recommend enabling 2FA using Google Authenticator or Authy. This prevents unauthorized access even if someone knows your password.",
    category: 'security'
  },
  {
    question: "Can I stake Ethereum on BitCurrent?",
    answer: "Yes! BitCurrent offers Ethereum staking with 5-6% annual percentage yield (APY). You can choose flexible staking (unstake anytime) or 90-day locked staking for higher rewards. Minimum stake is 0.01 ETH. Rewards are calculated daily and automatically compounded.",
    category: 'staking'
  },
  {
    question: "What happens if BitCurrent gets hacked?",
    answer: "BitCurrent has never been hacked and employs industry-leading security measures. However, your funds are protected: 95% are stored in cold storage (offline, unhackable), hot wallets are insured up to £85,000 per user through FSCS, we maintain additional insurance coverage, and all security incidents are covered by our guarantee policy.",
    category: 'security'
  },
  {
    question: "How does BitCurrent compare to Coinbase and Binance?",
    answer: "BitCurrent offers lower fees (0.1% vs Coinbase's 1.49%), is UK-based and FCA regulated (unlike Binance), provides instant GBP deposits via Faster Payments, offers £85,000 FSCS insurance, and features advanced trading tools. We're built specifically for UK traders with GBP as the native currency.",
    category: 'getting-started'
  },
  {
    question: "Can I transfer crypto from another exchange to BitCurrent?",
    answer: "Yes! You can deposit cryptocurrency from any exchange or wallet. Go to your BitCurrent wallet, select the cryptocurrency, click 'Deposit', copy your BitCurrent deposit address, and send from your other exchange/wallet. Deposits typically confirm within 10-30 minutes depending on blockchain congestion.",
    category: 'trading'
  },
  {
    question: "What are the risks of cryptocurrency trading?",
    answer: "Cryptocurrency is highly volatile and risky. You could lose all your invested capital. Prices can swing 10-30% in a single day. Only invest money you can afford to lose. BitCurrent provides risk warnings, but you are responsible for your trading decisions. We recommend starting small, diversifying, and never investing more than 5-10% of your savings in crypto.",
    category: 'legal'
  }
]

// Generate FAQPage schema for SEO
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

