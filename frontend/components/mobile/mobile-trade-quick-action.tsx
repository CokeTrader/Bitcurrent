'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

interface QuickTradeProps {
  pair?: string;
  currentPrice?: number;
}

export default function MobileTradeQuickAction({ pair = 'BTC/USD', currentPrice = 67234.50 }: QuickTradeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');

  const handleQuickTrade = async () => {
    if (!amount) return;

    try {
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair,
          side,
          amount: parseFloat(amount),
          type: 'market'
        })
      });

      if (response.ok) {
        alert(`${side.toUpperCase()} order placed!`);
        setAmount('');
        setIsOpen(false);
      } else {
        alert('Failed to place order');
      }
    } catch (error) {
      alert('Error placing order');
    }
  };

  return (
    <>
      {/* Quick Trade FAB (Floating Action Button) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 lg:hidden z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center"
      >
        <TrendingUp className="w-6 h-6 text-white" />
      </button>

      {/* Quick Trade Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden flex items-end">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full p-6 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Quick Trade
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Current Price */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {pair} Price
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                £{currentPrice.toLocaleString()}
              </div>
            </div>

            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => setSide('buy')}
                className={`py-4 rounded-xl font-bold transition-all ${
                  side === 'buy'
                    ? 'bg-green-600 text-white scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                Buy
              </button>
              <button
                onClick={() => setSide('sell')}
                className={`py-4 rounded-xl font-bold transition-all ${
                  side === 'sell'
                    ? 'bg-red-600 text-white scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <TrendingDown className="w-6 h-6 mx-auto mb-1" />
                Sell
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount ({pair.split('/')[0]})
              </label>
              <input
                type="number"
                step="0.00000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="0.001"
              />
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['10%', '25%', '50%', '100%'].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setAmount((0.001 * parseFloat(pct) / 100).toFixed(8))}
                    className="py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {pct}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            {amount && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    £{(parseFloat(amount) * currentPrice).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Fee (0.25%)</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    £{(parseFloat(amount) * currentPrice * 0.0025).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleQuickTrade}
              disabled={!amount}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                side === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {side === 'buy' ? 'Buy' : 'Sell'} {pair.split('/')[0]}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

