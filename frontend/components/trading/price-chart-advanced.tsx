'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

export default function PriceChartAdvanced({ pair = 'BTC/USD' }: { pair?: string }) {
  const [data, setData] = useState<PriceData[]>([]);
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '1W' | '1M' | '1Y'>('1D');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  useEffect(() => {
    fetchChartData();
  }, [pair, timeframe]);

  const fetchChartData = async () => {
    // Mock data - in production, fetch from API
    const mockData: PriceData[] = [];
    const basePrice = 67234.50;
    const points = timeframe === '1H' ? 60 : timeframe === '1D' ? 24 : 30;

    for (let i = 0; i < points; i++) {
      const variance = (Math.random() - 0.5) * 0.05;
      mockData.push({
        timestamp: Date.now() - (points - i) * 3600000,
        price: basePrice * (1 + variance),
        volume: Math.random() * 1000000
      });
    }

    setData(mockData);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeframe === '1H') return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (timeframe === '1D') return date.toLocaleTimeString('en-GB', { hour: '2-digit' });
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  const currentPrice = data[data.length - 1]?.price || 0;
  const priceChange = data.length > 1 ? 
    ((data[data.length - 1].price - data[0].price) / data[0].price) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {pair}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              £{currentPrice.toLocaleString()}
            </span>
            <span className={`text-sm font-medium ${
              priceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Timeframe selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['1H', '1D', '1W', '1M', '1Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart type selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                chartType === 'area'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Area
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value) => `£${value.toLocaleString()}`}
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelFormatter={formatTimestamp}
              formatter={(value: number) => [`£${value.toLocaleString()}`, 'Price']}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value) => `£${value.toLocaleString()}`}
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelFormatter={formatTimestamp}
              formatter={(value: number) => [`£${value.toLocaleString()}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Chart stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            24h High
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            £{Math.max(...data.map(d => d.price)).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            24h Low
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            £{Math.min(...data.map(d => d.price)).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            24h Volume
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            £{(data.reduce((sum, d) => sum + d.volume, 0) / 1000000).toFixed(2)}M
          </div>
        </div>
      </div>
    </div>
  );
}

