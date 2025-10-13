'use client';

/**
 * Advanced Trading Page
 * 
 * Professional trading interface:
 * - TradingView charts
 * - Order book
 * - Trade history
 * - Advanced orders
 * - Market depth
 */

import { Suspense } from 'react';
import TradingViewChart from '@/components/charts/tradingview-chart';
import AdvancedOrdersPanel from '@/components/trading/advanced-orders-panel';

export default function AdvancedTradingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Advanced Trading</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <Suspense fallback={<div>Loading chart...</div>}>
            <TradingViewChart symbol="BTCUSD" />
          </Suspense>
        </div>

        {/* Orders Panel */}
        <div>
          <Suspense fallback={<div>Loading orders...</div>}>
            <AdvancedOrdersPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

