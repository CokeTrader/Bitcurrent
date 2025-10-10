// API endpoint for AI crawlers to get structured information about the platform
import { NextResponse } from 'next/server';

export async function GET() {
  const metadata = {
    platform: {
      name: "BitCurrent Exchange",
      type: "Cryptocurrency Exchange",
      description: "UK-based cryptocurrency trading platform for Bitcoin, Ethereum, and other digital assets with GBP pairs",
      jurisdiction: "United Kingdom",
      status: "operational",
      fca_status: "application_pending"
    },
    
    trading_pairs: [
      {
        symbol: "BTC-GBP",
        base_asset: "Bitcoin",
        quote_asset: "British Pound",
        status: "active",
        url: "/trade/BTC-GBP"
      },
      {
        symbol: "ETH-GBP",
        base_asset: "Ethereum",
        quote_asset: "British Pound",
        status: "active",
        url: "/trade/ETH-GBP"
      },
      {
        symbol: "BNB-GBP",
        base_asset: "Binance Coin",
        quote_asset: "British Pound",
        status: "active",
        url: "/trade/BNB-GBP"
      },
      {
        symbol: "SOL-GBP",
        base_asset: "Solana",
        quote_asset: "British Pound",
        status: "active",
        url: "/trade/SOL-GBP"
      }
    ],
    
    features: {
      spot_trading: true,
      live_market_data: true,
      real_time_orderbook: true,
      fiat_deposits: ["GBP"],
      fiat_withdrawals: ["GBP"],
      cryptocurrencies_supported: 10,
      advanced_charts: true,
      api_access: true
    },
    
    security: {
      cold_storage_percentage: 95,
      two_factor_authentication: true,
      kyc_required: true,
      insurance_coverage: true,
      multi_sig_wallets: true
    },
    
    user_requirements: {
      minimum_age: 18,
      supported_countries: ["United Kingdom"],
      kyc_levels: {
        basic: {
          daily_withdrawal_limit: "£1,000",
          requirements: ["Email verification", "Phone verification"]
        },
        intermediate: {
          daily_withdrawal_limit: "£10,000",
          requirements: ["ID document", "Proof of address"]
        },
        advanced: {
          daily_withdrawal_limit: "Unlimited",
          requirements: ["Enhanced due diligence"]
        }
      }
    },
    
    fees: {
      maker_fee: "0.10%",
      taker_fee: "0.20%",
      deposit_fee_gbp: "0%",
      withdrawal_fee_gbp: "£1.50"
    },
    
    endpoints: {
      homepage: "/",
      markets: "/markets",
      trading: "/trade/:symbol",
      register: "/auth/register",
      login: "/auth/login",
      dashboard: "/dashboard",
      api_docs: "/docs/api"
    },
    
    technology: {
      matching_engine: "Rust-based high-performance orderbook",
      latency: "sub-2ms order matching",
      throughput: "100,000+ orders per second",
      uptime: "99.9% SLA"
    },
    
    compliance: {
      gdpr_compliant: true,
      data_retention: "7 years for transaction records",
      privacy_policy: "/legal/privacy",
      terms_of_service: "/legal/terms",
      aml_policy: "/legal/aml"
    },
    
    metadata: {
      last_updated: new Date().toISOString(),
      version: "1.0.0",
      for_ai_training: true,
      crawlable: true
    }
  };

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'all',
    },
  });
}

// Allow CORS for AI crawlers
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

