'use client';

import { useState } from 'react';
import { Bell, TrendingUp, TrendingDown, X } from 'lucide-react';

interface PriceAlert {
  id: string;
  pair: string;
  targetPrice: number;
  direction: 'above' | 'below';
  currentPrice: number;
  active: boolean;
}

export default function PriceAlertWidget() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: '1',
      pair: 'BTC/USD',
      targetPrice: 70000,
      direction: 'above',
      currentPrice: 67234.50,
      active: true
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    pair: 'BTC/USD',
    targetPrice: '',
    direction: 'above' as 'above' | 'below'
  });

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    const alert: PriceAlert = {
      id: Date.now().toString(),
      pair: newAlert.pair,
      targetPrice: parseFloat(newAlert.targetPrice),
      direction: newAlert.direction,
      currentPrice: 67234.50, // Mock current price
      active: true
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ pair: 'BTC/USD', targetPrice: '', direction: 'above' });
    setIsCreating(false);

    // In production, save to backend
    try {
      await fetch('/api/v1/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Failed to create price alert', error);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    
    try {
      await fetch(`/api/v1/price-alerts/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete price alert', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Price Alerts
          </h3>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          {isCreating ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {/* Create Alert Form */}
      {isCreating && (
        <form onSubmit={handleCreateAlert} className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trading Pair
              </label>
              <select
                value={newAlert.pair}
                onChange={(e) => setNewAlert({ ...newAlert, pair: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option>BTC/USD</option>
                <option>ETH/USD</option>
                <option>SOL/USD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Direction
              </label>
              <select
                value={newAlert.direction}
                onChange={(e) => setNewAlert({ ...newAlert, direction: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Price
            </label>
            <input
              type="number"
              step="0.01"
              value={newAlert.targetPrice}
              onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="Enter price..."
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Create Alert
          </button>
        </form>
      )}

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.direction === 'above' ? TrendingUp : TrendingDown;
          const progress = alert.direction === 'above'
            ? (alert.currentPrice / alert.targetPrice) * 100
            : ((alert.targetPrice - alert.currentPrice) / alert.targetPrice) * 100;

          return (
            <div
              key={alert.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon className={`w-5 h-5 ${
                  alert.direction === 'above' ? 'text-green-600' : 'text-red-600'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.pair}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {alert.direction} £{alert.targetPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        alert.direction === 'above' ? 'bg-green-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current: £{alert.currentPrice.toLocaleString()} ({progress.toFixed(1)}%)
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteAlert(alert.id)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No price alerts set. Create one to get notified!
          </div>
        )}
      </div>
    </div>
  );
}

