'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, Shield, Clock } from 'lucide-react';

export default function SocialProofEnhanced() {
  const [stats, setStats] = useState({
    users: 0,
    volume24h: 0,
    trades: 0,
    uptime: 0
  });

  useEffect(() => {
    // Animate numbers on mount
    const targetStats = {
      users: 1247,
      volume24h: 3456789,
      trades: 8234,
      uptime: 99.9
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setStats({
        users: Math.floor(targetStats.users * progress),
        volume24h: Math.floor(targetStats.volume24h * progress),
        trades: Math.floor(targetStats.trades * progress),
        uptime: targetStats.uptime * progress
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const statItems = [
    {
      icon: Users,
      value: stats.users.toLocaleString() + '+',
      label: 'Active Traders',
      color: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      value: '£' + (stats.volume24h / 1000000).toFixed(1) + 'M',
      label: '24h Trading Volume',
      color: 'text-green-600'
    },
    {
      icon: Shield,
      value: stats.trades.toLocaleString() + '+',
      label: 'Trades Executed',
      color: 'text-purple-600'
    },
    {
      icon: Clock,
      value: stats.uptime.toFixed(1) + '%',
      label: 'Uptime',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="text-center">
                <Icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {item.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Bank-Grade Security</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">FCA Registered</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">£85k FSCS Protected</span>
          </div>
        </div>

        {/* Live Users Counter */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              127 traders online now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

