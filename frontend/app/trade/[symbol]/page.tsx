"use client";

import { useParams } from 'next/navigation';
import { LiveOrderbook } from '@/components/trading/LiveOrderbook';
import { TradingChart } from '@/components/trading/TradingChart';
import { OrderForm } from '@/components/trading/OrderForm';
import { OrderHistory } from '@/components/trading/OrderHistory';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { useState } from 'react';

export default function TradePage() {
  const params = useParams();
  const symbol = params.symbol as string || 'BTC-GBP';
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');

  const handleOrderPlaced = () => {
    // Refresh order history and balances
    console.log('Order placed, refreshing data...');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="text-2xl font-bold">BitCurrent</a>
              <div className="flex gap-4">
                <a href="/trade/BTC-GBP" className="text-sm hover:text-primary transition">Markets</a>
                <a href="/dashboard" className="text-sm hover:text-primary transition">Portfolio</a>
                <a href="/account" className="text-sm hover:text-primary transition">Account</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/auth/login"
                className="text-sm hover:text-primary transition"
              >
                Sign In
              </a>
              <a
                href="/auth/register"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition"
              >
                Register
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Trading Interface */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Orderbook */}
          <div className="col-span-12 lg:col-span-3">
            <LiveOrderbook symbol={symbol} depth={15} />
          </div>

          {/* Center Column - Chart + Orders */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            <TradingChart symbol={symbol} />
            
            {/* Order Tabs */}
            <div className="bg-card rounded-lg border border-border">
              <div className="flex border-b border-border">
                <button className="px-6 py-3 font-medium border-b-2 border-primary">
                  Open Orders
                </button>
                <button className="px-6 py-3 font-medium text-muted-foreground hover:text-foreground">
                  Order History
                </button>
                <button className="px-6 py-3 font-medium text-muted-foreground hover:text-foreground">
                  Trade History
                </button>
              </div>
              
              <div className="p-4">
                <OrderHistory symbol={symbol} />
              </div>
            </div>
          </div>

          {/* Right Column - Order Form */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Buy/Sell Toggle */}
            <div className="bg-card rounded-lg border border-border p-1 flex gap-1">
              <button
                onClick={() => setOrderSide('buy')}
                className={`flex-1 py-2 rounded-md font-semibold transition ${
                  orderSide === 'buy'
                    ? 'bg-buy text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setOrderSide('sell')}
                className={`flex-1 py-2 rounded-md font-semibold transition ${
                  orderSide === 'sell'
                    ? 'bg-sell text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sell
              </button>
            </div>

            <OrderForm
              symbol={symbol}
              side={orderSide}
              onOrderPlaced={handleOrderPlaced}
            />

            {/* Recent Trades */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">Recent Trades</h3>
              <TradeHistory symbol={symbol} compact limit={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



