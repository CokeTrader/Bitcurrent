'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Asset {
  name: string;
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

export default function AssetAllocation() {
  const assets: Asset[] = [
    { name: 'Bitcoin', symbol: 'BTC', value: 6723.45, percentage: 65, color: '#F7931A' },
    { name: 'Ethereum', symbol: 'ETH', value: 2068.50, percentage: 20, color: '#627EEA' },
    { name: 'Solana', symbol: 'SOL', value: 1034.25, percentage: 10, color: '#00FFA3' },
    { name: 'Cash', symbol: 'GBP', value: 517.13, percentage: 5, color: '#6B7280' }
  ];

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Asset Allocation
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={assets}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {assets.map((asset, index) => (
                  <Cell key={`cell-${index}`} fill={asset.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `£${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Asset List */}
        <div className="space-y-3">
          {assets.map((asset) => (
            <div key={asset.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: asset.color }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {asset.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {asset.symbol}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  £{asset.value.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {asset.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Portfolio Value
          </span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            £{totalValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Diversification Score */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Diversification Score
          </span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {(100 - assets[0].percentage).toFixed(0)}/100
          </span>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
          {assets[0].percentage > 70 ? 'Consider diversifying your portfolio' : 'Good diversification'}
        </p>
      </div>
    </div>
  );
}

