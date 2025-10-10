"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { apiClient } from '@/lib/api/client';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Balance {
  currency: string;
  balance: string;
  available_balance: string;
  reserved_balance: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchBalances = async () => {
      if (!user) return;
      
      try {
        const data = await apiClient.getBalances(user.id);
        setBalances(data.balances || []);
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [user, isAuthenticated, router]);

  const calculateTotalValue = () => {
    // TODO: Convert all balances to GBP using current prices
    const gbpBalance = balances.find(b => b.currency === 'GBP');
    return gbpBalance ? parseFloat(gbpBalance.balance) : 0;
  };

  const totalValue = calculateTotalValue();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="text-2xl font-bold">BitCurrent</a>
              <div className="flex gap-4">
                <a href="/trade/BTC-GBP" className="text-sm hover:text-primary transition">Trade</a>
                <a href="/dashboard" className="text-sm text-primary font-semibold">Portfolio</a>
                <a href="/account" className="text-sm hover:text-primary transition">Account</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <button
                onClick={() => {
                  apiClient.logout();
                  useAuthStore.getState().logout();
                  router.push('/');
                }}
                className="text-sm text-destructive hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">Overview of your BitCurrent account</p>
        </div>

        {/* Total Value Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Total Value</span>
            </div>
            <div className="text-3xl font-bold">
              £{totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground mt-2">GBP Equivalent</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">24h Change</span>
            </div>
            <div className="text-3xl font-bold text-buy">+£0.00</div>
            <div className="text-sm text-muted-foreground mt-2">+0.00%</div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <span className="text-sm">KYC Status</span>
            </div>
            <div className="text-lg font-semibold">
              Level {user?.kyc_level || 0}
            </div>
            <a href="/account/kyc" className="text-sm text-primary hover:underline mt-2 inline-block">
              Upgrade →
            </a>
          </div>
        </div>

        {/* Balances */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Balances</h2>
          
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading balances...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 font-medium text-muted-foreground">Asset</th>
                    <th className="text-right py-3 font-medium text-muted-foreground">Total Balance</th>
                    <th className="text-right py-3 font-medium text-muted-foreground">Available</th>
                    <th className="text-right py-3 font-medium text-muted-foreground">In Orders</th>
                    <th className="text-right py-3 font-medium text-muted-foreground">Value (GBP)</th>
                    <th className="text-center py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance) => {
                    const total = parseFloat(balance.balance);
                    const available = parseFloat(balance.available_balance);
                    const reserved = parseFloat(balance.reserved_balance);
                    const value = balance.currency === 'GBP' ? total : 0; // TODO: Calculate value

                    return (
                      <tr key={balance.currency} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                              {balance.currency.substring(0, 1)}
                            </div>
                            <div>
                              <div className="font-semibold">{balance.currency}</div>
                              <div className="text-xs text-muted-foreground">
                                {balance.currency === 'BTC' ? 'Bitcoin' :
                                 balance.currency === 'ETH' ? 'Ethereum' :
                                 balance.currency === 'GBP' ? 'British Pound' :
                                 balance.currency}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right font-mono font-semibold">
                          {total.toFixed(balance.currency === 'GBP' ? 2 : 8)}
                        </td>
                        <td className="py-4 text-right font-mono">
                          {available.toFixed(balance.currency === 'GBP' ? 2 : 8)}
                        </td>
                        <td className="py-4 text-right font-mono text-muted-foreground">
                          {reserved.toFixed(balance.currency === 'GBP' ? 2 : 8)}
                        </td>
                        <td className="py-4 text-right font-mono">
                          £{value.toFixed(2)}
                        </td>
                        <td className="py-4">
                          <div className="flex justify-center gap-2">
                            <button className="px-3 py-1 text-xs bg-buy hover:bg-buy-dark text-white rounded transition">
                              Deposit
                            </button>
                            <button className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition">
                              Withdraw
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/trade/BTC-GBP"
            className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Trade</div>
                <div className="font-semibold">BTC/GBP</div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
            </div>
          </a>

          <a
            href="/trade/ETH-GBP"
            className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Trade</div>
                <div className="font-semibold">ETH/GBP</div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
            </div>
          </a>

          <a
            href="/deposits"
            className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Deposit</div>
                <div className="font-semibold">Add Funds</div>
              </div>
              <ArrowDownRight className="w-5 h-5 text-muted-foreground group-hover:text-buy transition" />
            </div>
          </a>

          <a
            href="/withdrawals"
            className="bg-card border border-border rounded-lg p-6 hover:bg-muted/50 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Withdraw</div>
                <div className="font-semibold">Cash Out</div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}



