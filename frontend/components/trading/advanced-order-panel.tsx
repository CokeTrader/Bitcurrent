'use client';

import { useState } from 'react';
import { AlertTriangle, TrendingUp, Shield } from 'lucide-react';

interface OrderFormData {
  type: 'market' | 'limit' | 'stop-loss' | 'take-profit';
  side: 'buy' | 'sell';
  amount: string;
  price: string;
  stopPrice: string;
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  postOnly: boolean;
  reduceOnly: boolean;
}

export default function AdvancedOrderPanel({ pair = 'BTC/USD' }: { pair?: string }) {
  const [formData, setFormData] = useState<OrderFormData>({
    type: 'limit',
    side: 'buy',
    amount: '',
    price: '',
    stopPrice: '',
    timeInForce: 'GTC',
    postOnly: false,
    reduceOnly: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call to place order
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair,
          ...formData
        })
      });

      if (response.ok) {
        alert('Order placed successfully!');
        // Reset form
        setFormData(prev => ({ ...prev, amount: '', price: '', stopPrice: '' }));
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const price = parseFloat(formData.price) || 0;
    return (amount * price).toFixed(2);
  };

  const calculateFee = () => {
    const total = parseFloat(calculateTotal());
    return (total * 0.0025).toFixed(2); // 0.25% fee
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Advanced Order
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Order Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['market', 'limit', 'stop-loss', 'take-profit'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formData.type === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Side (Buy/Sell) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, side: 'buy' }))}
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              formData.side === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <TrendingUp className="w-5 h-5 mx-auto mb-1" />
            Buy
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, side: 'sell' }))}
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              formData.side === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <TrendingUp className="w-5 h-5 mx-auto mb-1 rotate-180" />
            Sell
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.00000001"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0.00"
              required
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              {pair.split('/')[0]}
            </div>
          </div>
        </div>

        {/* Price (for limit/stop orders) */}
        {formData.type !== 'market' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {formData.type === 'limit' ? 'Limit Price' : 'Stop Price'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.type === 'limit' ? formData.price : formData.stopPrice}
                onChange={(e) => {
                  if (formData.type === 'limit') {
                    setFormData(prev => ({ ...prev, price: e.target.value }));
                  } else {
                    setFormData(prev => ({ ...prev, stopPrice: e.target.value }));
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                {pair.split('/')[1]}
              </div>
            </div>
          </div>
        )}

        {/* Advanced Options */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Advanced Options
          </h4>

          {/* Time in Force */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Time in Force
            </label>
            <select
              value={formData.timeInForce}
              onChange={(e) => setFormData(prev => ({ ...prev, timeInForce: e.target.value as any }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="GTC">Good Till Cancel (GTC)</option>
              <option value="IOC">Immediate or Cancel (IOC)</option>
              <option value="FOK">Fill or Kill (FOK)</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.postOnly}
                onChange={(e) => setFormData(prev => ({ ...prev, postOnly: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Post Only (Maker only)
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.reduceOnly}
                onChange={(e) => setFormData(prev => ({ ...prev, reduceOnly: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Reduce Only (Close position only)
              </span>
            </label>
          </div>
        </div>

        {/* Order Summary */}
        {formData.amount && formData.price && formData.type !== 'market' && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {pair.split('/')[1]} {calculateTotal()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Fee (0.25%):</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {pair.split('/')[1]} {calculateFee()}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-gray-900 dark:text-white">Final Total:</span>
              <span className="text-gray-900 dark:text-white">
                {pair.split('/')[1]} {(parseFloat(calculateTotal()) + parseFloat(calculateFee())).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Risk Warning */}
        {(formData.type === 'stop-loss' || formData.type === 'take-profit') && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              {formData.type === 'stop-loss' 
                ? 'Stop-loss orders help limit losses but may execute at worse prices during high volatility.'
                : 'Take-profit orders help secure gains but may not execute if price doesn\'t reach the target.'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-lg font-bold transition-colors ${
            formData.side === 'buy'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? 'Placing Order...' : `${formData.side === 'buy' ? 'Buy' : 'Sell'} ${pair.split('/')[0]}`}
        </button>
      </form>
    </div>
  );
}

