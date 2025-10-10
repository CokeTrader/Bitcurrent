"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';

interface OrderFormProps {
  symbol: string;
  side: 'buy' | 'sell';
  onOrderPlaced?: () => void;
}

export function OrderForm({ symbol, side, onOrderPlaced }: OrderFormProps) {
  const { user } = useAuthStore();
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [total, setTotal] = useState('0.00');
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Extract currencies from symbol
  const [baseCurrency, quoteCurrency] = symbol.split('-');

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      
      try {
        const data = await apiClient.getBalances(user.id);
        setBalance(data.balances);
      } catch (err) {
        console.error('Failed to fetch balances:', err);
      }
    };

    fetchBalance();
  }, [user]);

  // Calculate total
  useEffect(() => {
    if (orderType === 'limit' && price && quantity) {
      const p = parseFloat(price);
      const q = parseFloat(quantity);
      if (!isNaN(p) && !isNaN(q)) {
        const total = p * q;
        const fee = total * 0.0015; // 0.15% taker fee
        setTotal((total + fee).toFixed(2));
      }
    } else if (orderType === 'market' && quantity) {
      // For market orders, estimate with current price
      setTotal('Market Price');
    }
  }, [price, quantity, orderType]);

  const getAvailableBalance = () => {
    if (!balance) return '0.00';
    
    const currency = side === 'buy' ? quoteCurrency : baseCurrency;
    const wallet = balance.find((b: any) => b.currency === currency);
    return wallet ? wallet.available_balance : '0.00';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const order = {
        symbol,
        side,
        order_type: orderType,
        price: orderType === 'limit' ? price : undefined,
        quantity,
        time_in_force: 'GTC',
      };

      const response = await apiClient.placeOrder(order);
      
      setSuccess(`Order placed successfully! Status: ${response.status}`);
      setPrice('');
      setQuantity('');
      setTotal('0.00');
      
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const isBuy = side === 'buy';

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setOrderType('limit')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
            orderType === 'limit'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Limit
        </button>
        <button
          type="button"
          onClick={() => setOrderType('market')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
            orderType === 'market'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Market
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-buy/10 border border-buy text-buy px-4 py-3 rounded text-sm">
            {success}
          </div>
        )}

        {/* Price (only for limit orders) */}
        {orderType === 'limit' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Price ({quoteCurrency})
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
              placeholder="0.00"
            />
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount ({baseCurrency})
          </label>
          <input
            type="number"
            step="0.0001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            placeholder="0.0000"
          />
        </div>

        {/* Total */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Total ({quoteCurrency})
          </label>
          <div className="px-4 py-2 border border-input rounded-md bg-muted font-mono text-muted-foreground">
            {total}
          </div>
        </div>

        {/* Available Balance */}
        <div className="text-sm text-muted-foreground">
          <span>Available: </span>
          <span className="font-mono font-semibold">
            {getAvailableBalance()} {side === 'buy' ? quoteCurrency : baseCurrency}
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !user}
          className={`w-full px-4 py-3 rounded-md font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
            isBuy
              ? 'bg-buy hover:bg-buy-dark text-white'
              : 'bg-sell hover:bg-sell-dark text-white'
          }`}
        >
          {loading ? 'Placing Order...' : `${isBuy ? 'Buy' : 'Sell'} ${baseCurrency}`}
        </button>

        {!user && (
          <p className="text-xs text-center text-muted-foreground">
            Please <a href="/auth/login" className="text-primary hover:underline">sign in</a> to place orders
          </p>
        )}
      </form>

      {/* Fee Information */}
      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Maker Fee:</span>
          <span>0.10%</span>
        </div>
        <div className="flex justify-between">
          <span>Taker Fee:</span>
          <span>0.15%</span>
        </div>
      </div>
    </div>
  );
}



