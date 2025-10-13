'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';

export default function MobileTradeScreen({ pair = 'BTC/USD' }: { pair?: string }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  const currentPrice = 67234.50;
  const change24h = 2.5;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Price Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {pair}
          </h1>
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            24H
          </span>
        </div>

        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            £{currentPrice.toLocaleString()}
          </span>
          <span className={`text-lg font-medium mb-1 ${
            change24h >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change24h >= 0 ? '+' : ''}{change24h}%
          </span>
        </div>

        {/* Mini Chart */}
        <div className="mt-4 h-24 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg flex items-end px-1 gap-0.5">
          {Array.from({ length: 30 }).map((_, i) => {
            const height = 30 + Math.random() * 70;
            return (
              <div
                key={i}
                className="flex-1 bg-blue-500/50 rounded-t"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Order Type Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderType('market')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              orderType === 'market'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            Market
          </button>
          <button
            onClick={() => setOrderType('limit')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              orderType === 'limit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Limit
          </button>
        </div>
      </div>

      {/* Order Form */}
      <div className="p-4 space-y-4">
        {/* Buy/Sell Toggle */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSide('buy')}
            className={`py-6 rounded-2xl font-bold text-lg transition-all ${
              side === 'buy'
                ? 'bg-green-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700'
            }`}
          >
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            Buy
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`py-6 rounded-2xl font-bold text-lg transition-all ${
              side === 'sell'
                ? 'bg-red-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700'
            }`}
          >
            <TrendingDown className="w-8 h-8 mx-auto mb-2" />
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Amount
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.00000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white"
              placeholder="0.00"
            />
            <span className="text-xl font-medium text-gray-500 dark:text-gray-400">
              {pair.split('/')[0]}
            </span>
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {['25%', '50%', '75%', 'Max'].map((pct) => (
              <button
                key={pct}
                onClick={() => setAmount((0.001 * parseFloat(pct) / 100).toFixed(8))}
                className="py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {pct}
              </button>
            ))}
          </div>
        </div>

        {/* Price Input (Limit only) */}
        {orderType === 'limit' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Limit Price
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white"
                placeholder={currentPrice.toFixed(2)}
              />
              <span className="text-xl font-medium text-gray-500 dark:text-gray-400">
                {pair.split('/')[1]}
              </span>
            </div>
          </div>
        )}

        {/* Order Summary */}
        {amount && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
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
            <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-gray-900 dark:text-white">Final Total</span>
              <span className="text-gray-900 dark:text-white">
                £{(parseFloat(amount) * currentPrice * 1.0025).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Place Order Button */}
        <button
          disabled={!amount}
          className={`w-full py-5 rounded-2xl font-bold text-lg shadow-lg transition-all ${
            side === 'buy'
              ? 'bg-green-600 hover:bg-green-700 active:scale-95'
              : 'bg-red-600 hover:bg-red-700 active:scale-95'
          } text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}
        >
          {side === 'buy' ? 'Buy' : 'Sell'} {pair.split('/')[0]}
        </button>

        {/* Available Balance */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Available: £{side === 'buy' ? '10,343.27' : '0.15 BTC'}
        </div>
      </div>
    </div>
  );
}

