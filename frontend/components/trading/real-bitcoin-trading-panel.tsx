'use client';

/**
 * Real Bitcoin Trading Panel
 * 
 * THE COMPLETE USER FLOW:
 * 1. Deposit £10 → Buy BTC → Withdraw to wallet OR Sell → Withdraw fiat with PnL
 * 
 * This is the CORE functionality of BitCurrent as a true crypto broker
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Balance {
  gbp: number;
  btc: number;
}

interface Portfolio {
  gbp: number;
  btc: number;
  btcValueInGBP: number;
  totalValueInGBP: number;
  currentBTCPrice: number;
  pnl: {
    realized: number;
    unrealized: number;
    total: number;
    percentage: string;
  };
}

export default function RealBitcoinTradingPanel() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'buy' | 'sell' | 'withdraw'>('deposit');
  const [balance, setBalance] = useState<Balance>({ gbp: 0, btc: 0 });
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [depositAmount, setDepositAmount] = useState('10');
  const [buyAmount, setBuyAmount] = useState('10');
  const [sellAmount, setSellAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/real-trading/portfolio', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPortfolio(data.portfolio);
        setBalance({
          gbp: data.portfolio.gbp,
          btc: data.portfolio.btc
        });
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // In production, this would integrate with Stripe Elements
      // For now, we'll show the flow
      
      const response = await fetch('/api/real-trading/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          paymentMethodId: 'pm_card_visa' // Demo payment method
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchPortfolio();
        setActiveTab('buy'); // Move to buy tab
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/real-trading/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          gbpAmount: parseFloat(buyAmount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `${data.message}\n\nNow you can:\n1. Sell it for profit/loss\n2. Withdraw to your wallet` 
        });
        fetchPortfolio();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/real-trading/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          btcAmount: parseFloat(sellAmount)
        })
      });

      const data = await response.json();

      if (data.success) {
        const pnlText = data.pnl.profitable 
          ? `🎉 Profit: £${data.pnl.amount} (${data.pnl.percentage})`
          : `📉 Loss: £${Math.abs(data.pnl.amount)} (${data.pnl.percentage})`;
        
        setMessage({ 
          type: 'success', 
          text: `${data.message}\n\n${pnlText}\n\nYou can now withdraw your £${data.gbpAmount.toFixed(2)} to your bank account.` 
        });
        fetchPortfolio();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/real-trading/withdraw-btc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          address: withdrawAddress,
          btcAmount: parseFloat(withdrawAmount)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `${data.message}\n\nEstimated arrival: ${data.estimatedArrival}\nNetwork fee: ${data.networkFee} BTC` 
        });
        fetchPortfolio();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Real Bitcoin Trading
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Deposit £10 → Buy BTC → Withdraw or Sell for profit
        </p>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-90">GBP Balance</p>
              <p className="text-xl font-bold">£{portfolio.gbp.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">BTC Balance</p>
              <p className="text-xl font-bold">{portfolio.btc.toFixed(8)} BTC</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Total Value</p>
              <p className="text-xl font-bold">£{portfolio.totalValueInGBP.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Total PnL</p>
              <p className={`text-xl font-bold ${portfolio.pnl.total >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {portfolio.pnl.total >= 0 ? '+' : ''}£{portfolio.pnl.total.toFixed(2)}
                <span className="text-sm ml-1">({portfolio.pnl.percentage})</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {(['deposit', 'buy', 'sell', 'withdraw'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Message Display */}
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <pre className="whitespace-pre-wrap font-sans">{message.text}</pre>
        </motion.div>
      )}

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'deposit' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (GBP)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min="10"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="10"
            />
            <p className="mt-2 text-sm text-gray-500">Minimum deposit: £10</p>
            <button
              onClick={handleDeposit}
              disabled={loading}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Deposit £${depositAmount}`}
            </button>
          </div>
        )}

        {activeTab === 'buy' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (GBP)
            </label>
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              min="1"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="10"
            />
            <p className="mt-2 text-sm text-gray-500">
              Available: £{balance.gbp.toFixed(2)}
              {portfolio && ` | BTC Price: £${portfolio.currentBTCPrice.toFixed(2)}`}
            </p>
            <button
              onClick={handleBuy}
              disabled={loading}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Buy Bitcoin for £${buyAmount}`}
            </button>
          </div>
        )}

        {activeTab === 'sell' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (BTC)
            </label>
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              min="0.00000001"
              step="0.00000001"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.001"
            />
            <p className="mt-2 text-sm text-gray-500">
              Available: {balance.btc.toFixed(8)} BTC
              {portfolio && sellAmount && ` | Sell value: £${(parseFloat(sellAmount) * portfolio.currentBTCPrice).toFixed(2)}`}
            </p>
            <button
              onClick={handleSell}
              disabled={loading}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Sell ${sellAmount || '0'} BTC`}
            </button>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bitcoin Address
            </label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-4"
              placeholder="bc1q..."
            />
            
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (BTC)
            </label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              min="0.0001"
              step="0.0001"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.001"
            />
            <p className="mt-2 text-sm text-gray-500">
              Available: {balance.btc.toFixed(8)} BTC | Min: 0.0001 BTC | Fee: 0.0001 BTC
            </p>
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Withdraw ${withdrawAmount || '0'} BTC`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

