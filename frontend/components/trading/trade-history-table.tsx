'use client';

import { useState } from 'react';
import { ArrowUpDown, Download, Filter } from 'lucide-react';

interface Trade {
  id: string;
  timestamp: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  fee: number;
  status: string;
}

export default function TradeHistoryTable() {
  const [trades, setTrades] = useState<Trade[]>([
    {
      id: '1',
      timestamp: '2025-10-13 01:00:00',
      pair: 'BTC/USD',
      side: 'buy',
      amount: 0.001,
      price: 67234.5,
      total: 67.23,
      fee: 0.17,
      status: 'filled'
    },
    {
      id: '2',
      timestamp: '2025-10-12 23:45:00',
      pair: 'ETH/USD',
      side: 'sell',
      amount: 0.05,
      price: 3567.89,
      total: 178.39,
      fee: 0.45,
      status: 'filled'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'pair'>('timestamp');

  const filteredTrades = trades.filter(trade => 
    filter === 'all' || trade.side === filter
  );

  const exportTrades = () => {
    const csv = [
      ['Timestamp', 'Pair', 'Side', 'Amount', 'Price', 'Total', 'Fee', 'Status'],
      ...filteredTrades.map(t => [
        t.timestamp,
        t.pair,
        t.side,
        t.amount,
        t.price,
        t.total,
        t.fee,
        t.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Trade History
        </h3>

        <div className="flex gap-2">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
          >
            <option value="all">All Trades</option>
            <option value="buy">Buy Only</option>
            <option value="sell">Sell Only</option>
          </select>

          {/* Export */}
          <button
            onClick={exportTrades}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pair
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Side
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fee
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTrades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                  {trade.timestamp}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {trade.pair}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trade.side === 'buy' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {trade.side.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                  {trade.amount.toFixed(8)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                  £{trade.price.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                  £{trade.total.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                  £{trade.fee.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {trade.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTrades.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No trades found
        </div>
      )}
    </div>
  );
}

