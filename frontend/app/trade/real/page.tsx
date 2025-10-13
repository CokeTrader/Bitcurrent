'use client';

/**
 * Real Bitcoin Trading Page
 * 
 * The COMPLETE end-to-end flow:
 * 1. Deposit £10
 * 2. Buy REAL Bitcoin
 * 3. Either:
 *    - Withdraw to your wallet
 *    - Sell for profit/loss and withdraw fiat
 */

import { Suspense } from 'react';
import RealBitcoinTradingPanel from '@/components/trading/real-bitcoin-trading-panel';

export default function RealBitcoinTradingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Real Bitcoin Trading
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Start with £10. Buy real Bitcoin. Withdraw or sell with profit.
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How it works:
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                1
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Deposit £10+
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Via Stripe/Card
              </p>
            </div>
            
            <div className="hidden md:block text-2xl text-gray-400">→</div>
            
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                2
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Buy Bitcoin
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Real BTC via exchange
              </p>
            </div>
            
            <div className="hidden md:block text-2xl text-gray-400">→</div>
            
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                3
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Choose:
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Withdraw to wallet<br/>OR<br/>Sell for GBP + PnL
              </p>
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <RealBitcoinTradingPanel />
        </Suspense>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            📢 Important Information
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
            <li>• <strong>Real Money:</strong> This is REAL Bitcoin trading with your actual funds</li>
            <li>• <strong>Market Risk:</strong> Bitcoin prices are volatile. You can lose money.</li>
            <li>• <strong>Fees:</strong> Network fees apply for withdrawals (~0.0001 BTC)</li>
            <li>• <strong>KYC Required:</strong> Withdrawals require identity verification</li>
            <li>• <strong>Processing Time:</strong> BTC withdrawals take 10-60 minutes</li>
            <li>• <strong>Security:</strong> Never share your wallet private keys</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

