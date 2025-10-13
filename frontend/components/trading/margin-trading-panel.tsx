'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Shield } from 'lucide-react';

export default function MarginTradingPanel({ pair = 'BTC/USD' }: { pair?: string }) {
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [amount, setAmount] = useState('');
  const [leverage, setLeverage] = useState(2);
  const [entryPrice, setEntryPrice] = useState('67234.50');

  const calculateNotionalValue = () => {
    return parseFloat(amount || '0') * parseFloat(entryPrice || '0') * leverage;
  };

  const calculateRequiredMargin = () => {
    return calculateNotionalValue() / leverage;
  };

  const calculateLiquidationPrice = () => {
    const price = parseFloat(entryPrice || '0');
    const liquidationMove = price * (0.9 / leverage);
    return side === 'long' ? price - liquidationMove : price + liquidationMove;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-orange-500 dark:border-orange-600 p-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-medium text-orange-900 dark:text-orange-100 mb-1">
            High Risk Trading
          </div>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Margin trading can result in losses exceeding your initial investment. Only trade with funds you can afford to lose.
          </p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-orange-600" />
        Margin Trading
      </h3>

      {/* Long/Short Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setSide('long')}
          className={`py-4 rounded-lg font-bold transition-all ${
            side === 'long'
              ? 'bg-green-600 text-white scale-105 shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <TrendingUp className="w-6 h-6 mx-auto mb-1" />
          Long (Buy)
        </button>
        <button
          onClick={() => setSide('short')}
          className={`py-4 rounded-lg font-bold transition-all ${
            side === 'short'
              ? 'bg-red-600 text-white scale-105 shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <TrendingDown className="w-6 h-6 mx-auto mb-1" />
          Short (Sell)
        </button>
      </div>

      {/* Leverage Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Leverage: {leverage}x
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>1x (No leverage)</span>
          <span className="text-orange-600 font-medium">{leverage}x</span>
          <span>10x (Maximum)</span>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Amount
        </label>
        <input
          type="number"
          step="0.00000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
          placeholder="0.001"
        />
      </div>

      {/* Entry Price */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Entry Price
        </label>
        <input
          type="number"
          step="0.01"
          value={entryPrice}
          onChange={(e) => setEntryPrice(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
        />
      </div>

      {/* Position Summary */}
      {amount && entryPrice && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Notional Value:</span>
            <span className="font-bold text-gray-900 dark:text-white">
              £{calculateNotionalValue().toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Required Margin:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              £{calculateRequiredMargin().toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
            <span className="text-gray-600 dark:text-gray-400">Liquidation Price:</span>
            <span className="font-bold text-red-600 dark:text-red-400">
              £{calculateLiquidationPrice().toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Max Loss:</span>
            <span>£{calculateRequiredMargin().toLocaleString()} (100% of margin)</span>
          </div>
        </div>
      )}

      {/* Risk Warning */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-red-800 dark:text-red-200">
          <strong>Liquidation Risk:</strong> Your position will be automatically closed if price reaches £{calculateLiquidationPrice().toLocaleString()}. You will lose your entire margin of £{calculateRequiredMargin().toLocaleString()}.
        </p>
      </div>

      {/* Submit Button */}
      <button
        disabled={!amount || !entryPrice}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
          side === 'long'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        Open {side === 'long' ? 'Long' : 'Short'} Position ({leverage}x)
      </button>

      {/* Available Margin */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Available Margin: £10,343.27
      </div>
    </div>
  );
}

