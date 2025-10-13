'use client';

import { ArrowDownCircle, ArrowUpCircle, ShoppingCart, Gift, Award } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'bonus' | 'referral';
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function TransactionTimeline() {
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'deposit',
      amount: 100,
      currency: 'GBP',
      description: 'Card deposit via Stripe',
      timestamp: '2025-10-13 00:30',
      status: 'completed'
    },
    {
      id: '2',
      type: 'bonus',
      amount: 10,
      currency: 'GBP',
      description: 'Welcome bonus',
      timestamp: '2025-10-13 00:31',
      status: 'completed'
    },
    {
      id: '3',
      type: 'trade',
      amount: -50,
      currency: 'GBP',
      description: 'Buy 0.001 BTC @ £67,234',
      timestamp: '2025-10-13 00:45',
      status: 'completed'
    },
    {
      id: '4',
      type: 'referral',
      amount: 5,
      currency: 'GBP',
      description: 'Referral commission from user123',
      timestamp: '2025-10-13 01:00',
      status: 'completed'
    },
    {
      id: '5',
      type: 'withdrawal',
      amount: -20,
      currency: 'GBP',
      description: 'Bank transfer to GB29...',
      timestamp: '2025-10-13 01:15',
      status: 'pending'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return ArrowDownCircle;
      case 'withdrawal': return ArrowUpCircle;
      case 'trade': return ShoppingCart;
      case 'bonus': return Gift;
      case 'referral': return Award;
      default: return ArrowDownCircle;
    }
  };

  const getColor = (type: string, amount: number) => {
    if (type === 'bonus' || type === 'referral') return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
    if (amount > 0) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Transaction History
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* Transactions */}
        <div className="space-y-6">
          {transactions.map((tx) => {
            const Icon = getIcon(tx.type);
            const colorClass = getColor(tx.type, tx.amount);

            return (
              <div key={tx.id} className="relative flex gap-4">
                {/* Icon */}
                <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${colorClass} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {tx.description}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {tx.timestamp}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.currency} {Math.abs(tx.amount).toFixed(2)}
                      </div>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : tx.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No transactions yet
        </div>
      )}
    </div>
  );
}

