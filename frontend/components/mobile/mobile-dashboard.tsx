'use client';

import { useState } from 'react';
import { TrendingUp, Wallet, Activity, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function MobileDashboard() {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const totalBalance = 10343.27;
  const change24h = 234.56;
  const changePercent = 2.32;

  const quickActions = [
    { label: 'Buy Bitcoin', href: '/trade/BTCUSD', icon: TrendingUp, color: 'bg-green-600' },
    { label: 'Deposit', href: '/deposit', icon: Wallet, color: 'bg-blue-600' },
    { label: 'Orders', href: '/orders', icon: Activity, color: 'bg-purple-600' }
  ];

  const holdings = [
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.15, value: 10086.53, change: 2.5 },
    { symbol: 'ETH', name: 'Ethereum', amount: 0.5, value: 1783.95, change: -1.2 },
    { symbol: 'GBP', name: 'Cash', amount: 517.13, value: 517.13, change: 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/80 text-sm font-medium">Total Balance</span>
          <button
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {balanceVisible ? (
              <Eye className="w-5 h-5 text-white" />
            ) : (
              <EyeOff className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        <div className="mb-2">
          <div className="text-4xl font-bold text-white mb-1">
            {balanceVisible ? `£${totalBalance.toLocaleString()}` : '••••••'}
          </div>
          <div className={`flex items-center gap-2 text-sm ${
            change24h >= 0 ? 'text-green-300' : 'text-red-300'
          }`}>
            <TrendingUp className={`w-4 h-4 ${change24h < 0 ? 'rotate-180' : ''}`} />
            <span>
              {change24h >= 0 ? '+' : ''}£{Math.abs(change24h).toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent}%) Today
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Your Holdings
        </h2>

        <div className="space-y-3">
          {holdings.map((holding) => (
            <Link
              key={holding.symbol}
              href={`/trade/${holding.symbol}USD`}
              className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {holding.symbol[0]}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {holding.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {holding.amount} {holding.symbol}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    £{holding.value.toLocaleString()}
                  </div>
                  <div className={`text-sm ${
                    holding.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)}%
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <Link href="/orders" className="text-sm text-blue-600 dark:text-blue-400">
            View All
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
          {[
            { type: 'Buy', pair: 'BTC/USD', amount: '+0.001 BTC', time: '10 min ago', color: 'text-green-600' },
            { type: 'Deposit', pair: 'GBP', amount: '+£100', time: '1 hour ago', color: 'text-blue-600' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.type} {activity.pair}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.time}
                </div>
              </div>
              <div className={`text-sm font-medium ${activity.color}`}>
                {activity.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

