'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Percent } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  change: number;
  icon: any;
  color: string;
}

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      label: 'Total P&L',
      value: '+£1,234.56',
      change: 12.5,
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      label: 'Return (24h)',
      value: '+2.34%',
      change: 0.5,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      label: 'Win Rate',
      value: '67%',
      change: 5,
      icon: Percent,
      color: 'text-blue-500'
    },
    {
      label: 'Avg Trade',
      value: '£45.67',
      change: -3.2,
      icon: Activity,
      color: 'text-purple-500'
    }
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.change >= 0;

        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <Icon className={`w-8 h-8 ${metric.color}`} />
              <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(metric.change)}%
              </div>
            </div>

            <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">
              {metric.label}
            </div>

            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

