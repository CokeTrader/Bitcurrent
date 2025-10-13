'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    verified: number;
    verificationRate: string;
  };
  trading: {
    totalTrades: number;
    totalVolume: number;
    avgTradeSize: string;
  };
  financial: {
    totalDeposits: number;
    totalWithdrawals: number;
    netFlow: number;
  };
  system: {
    totalRequests: number;
    errorRate: string;
    avgResponseTime: string;
    slowRequests: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/dashboard');
      const data = await response.json();
      if (data.success) {
        setStats(data.dashboard);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Failed to load dashboard data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-green-600">
              {stats.users.verificationRate}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.users.total.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Users ({stats.users.verified} verified)
          </div>
        </div>

        {/* Trading */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.trading.totalTrades.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Trades (£{stats.trading.avgTradeSize} avg)
          </div>
        </div>

        {/* Financial */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <span className={`text-sm font-medium ${
              stats.financial.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.financial.netFlow >= 0 ? '+' : ''}
              £{stats.financial.netFlow.toLocaleString()}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            £{stats.financial.totalDeposits.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Deposits
          </div>
        </div>

        {/* System */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stats.system.errorRate}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.system.avgResponseTime}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg Response Time
          </div>
        </div>
      </div>

      {/* Alerts */}
      {stats.system.slowRequests > 10 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Performance Warning
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                {stats.system.slowRequests} slow requests detected. Consider scaling infrastructure.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-left">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Pending Withdrawals
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            3
          </div>
        </button>

        <button className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-left">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            KYC Reviews
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            7
          </div>
        </button>

        <button className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-left">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Support Tickets
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            12
          </div>
        </button>
      </div>
    </div>
  );
}

