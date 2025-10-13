'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';

interface Market {
  pair: string;
  name: string;
  lastPrice: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([
    {
      pair: 'BTC/USD',
      name: 'Bitcoin',
      lastPrice: 67234.50,
      change24h: 2.5,
      volume24h: 12345678,
      high24h: 68000,
      low24h: 66000
    },
    {
      pair: 'ETH/USD',
      name: 'Ethereum',
      lastPrice: 3567.89,
      change24h: -1.2,
      volume24h: 8765432,
      high24h: 3650,
      low24h: 3500
    },
    {
      pair: 'SOL/USD',
      name: 'Solana',
      lastPrice: 145.67,
      change24h: 5.8,
      volume24h: 2345678,
      high24h: 150,
      low24h: 138
    }
  ]);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all');

  const filteredMarkets = markets
    .filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                           m.pair.toLowerCase().includes(search.toLowerCase());
      
      if (filter === 'gainers') return matchesSearch && m.change24h > 0;
      if (filter === 'losers') return matchesSearch && m.change24h < 0;
      return matchesSearch;
    })
    .sort((a, b) => {
      if (filter === 'gainers') return b.change24h - a.change24h;
      if (filter === 'losers') return a.change24h - b.change24h;
      return b.volume24h - a.volume24h;
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Markets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time cryptocurrency prices and market data
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('gainers')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'gainers'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Gainers
            </button>
            <button
              onClick={() => setFilter('losers')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'losers'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Losers
            </button>
          </div>
        </div>

        {/* Markets Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    24h Volume
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    24h High
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    24h Low
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMarkets.map((market) => {
                  const isPositive = market.change24h >= 0;

                  return (
                    <tr key={market.pair} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {market.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {market.pair}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          £{market.lastPrice.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`flex items-center justify-end text-sm font-medium ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                          {isPositive ? '+' : ''}{market.change24h.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                        £{(market.volume24h / 1000000).toFixed(2)}M
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                        £{market.high24h.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                        £{market.low24h.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Link
                          href={`/trade/${market.pair.replace('/', '')}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          Trade
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMarkets.length === 0 && (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No markets found
            </div>
          )}
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Total Markets
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {markets.length}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              24h Trading Volume
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              £{(markets.reduce((sum, m) => sum + m.volume24h, 0) / 1000000).toFixed(2)}M
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Average 24h Change
            </div>
            <div className={`text-3xl font-bold ${
              markets.reduce((sum, m) => sum + m.change24h, 0) / markets.length >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {((markets.reduce((sum, m) => sum + m.change24h, 0) / markets.length)).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
