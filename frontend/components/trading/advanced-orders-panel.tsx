'use client';

/**
 * Advanced Orders Panel
 * 
 * Create sophisticated trading orders:
 * - Limit Orders (buy/sell at specific price)
 * - Stop-Loss (protect profits)
 * - Take-Profit (auto-sell at target)
 * - Trailing Stop (dynamic stop-loss)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Order {
  id: number;
  type: string;
  side: string;
  amount: number;
  limit_price?: number;
  stop_price?: number;
  take_profit_price?: number;
  trail_percent?: number;
  status: string;
  created_at: string;
}

export default function AdvancedOrdersPanel() {
  const [orderType, setOrderType] = useState<'limit' | 'stop-loss' | 'take-profit' | 'trailing-stop'>('limit');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [limitSide, setLimitSide] = useState<'buy' | 'sell'>('buy');
  const [limitAmount, setLimitAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  
  const [stopLossAmount, setStopLossAmount] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  
  const [takeProfitAmount, setTakeProfitAmount] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  
  const [trailingStopAmount, setTrailingStopAmount] = useState('');
  const [trailingPercent, setTrailingPercent] = useState('5');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/v1/advanced-orders?status=pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const createLimitOrder = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/advanced-orders/limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          side: limitSide,
          amount: parseFloat(limitAmount),
          limitPrice: parseFloat(limitPrice)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchOrders();
        setLimitAmount('');
        setLimitPrice('');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createStopLoss = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/advanced-orders/stop-loss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          btcAmount: parseFloat(stopLossAmount),
          stopPrice: parseFloat(stopLossPrice)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchOrders();
        setStopLossAmount('');
        setStopLossPrice('');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createTakeProfit = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/advanced-orders/take-profit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          btcAmount: parseFloat(takeProfitAmount),
          takeProfitPrice: parseFloat(takeProfitPrice)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchOrders();
        setTakeProfitAmount('');
        setTakeProfitPrice('');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createTrailingStop = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/advanced-orders/trailing-stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          btcAmount: parseFloat(trailingStopAmount),
          trailPercent: parseFloat(trailingPercent)
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchOrders();
        setTrailingStopAmount('');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/v1/advanced-orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        fetchOrders();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Advanced Orders
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Set automated buy/sell orders with sophisticated conditions
      </p>

      {/* Message */}
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
          {message.text}
        </motion.div>
      )}

      {/* Order Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {(['limit', 'stop-loss', 'take-profit', 'trailing-stop'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              orderType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Order Form */}
      <div className="mb-8">
        {orderType === 'limit' && (
          <div className="space-y-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setLimitSide('buy')}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  limitSide === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setLimitSide('sell')}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  limitSide === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Sell
              </button>
            </div>
            <input
              type="number"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              placeholder={limitSide === 'buy' ? 'Amount (GBP)' : 'Amount (BTC)'}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="Limit Price (GBP)"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={createLimitOrder}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Limit Order'}
            </button>
          </div>
        )}

        {orderType === 'stop-loss' && (
          <div className="space-y-4">
            <input
              type="number"
              value={stopLossAmount}
              onChange={(e) => setStopLossAmount(e.target.value)}
              placeholder="BTC Amount"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(e.target.value)}
              placeholder="Stop Price (GBP)"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={createStopLoss}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Stop-Loss'}
            </button>
          </div>
        )}

        {orderType === 'take-profit' && (
          <div className="space-y-4">
            <input
              type="number"
              value={takeProfitAmount}
              onChange={(e) => setTakeProfitAmount(e.target.value)}
              placeholder="BTC Amount"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(e.target.value)}
              placeholder="Take-Profit Price (GBP)"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={createTakeProfit}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Take-Profit'}
            </button>
          </div>
        )}

        {orderType === 'trailing-stop' && (
          <div className="space-y-4">
            <input
              type="number"
              value={trailingStopAmount}
              onChange={(e) => setTrailingStopAmount(e.target.value)}
              placeholder="BTC Amount"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              value={trailingPercent}
              onChange={(e) => setTrailingPercent(e.target.value)}
              placeholder="Trail Percent (%)"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={createTrailingStop}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Trailing Stop'}
            </button>
          </div>
        )}
      </div>

      {/* Active Orders */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Orders ({orders.length})
        </h3>
        {orders.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No active orders
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.type.toUpperCase()} - {order.side.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Amount: {order.amount} {order.side === 'buy' ? 'GBP' : 'BTC'}
                    </p>
                    {order.limit_price && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Limit: £{order.limit_price}
                      </p>
                    )}
                    {order.stop_price && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Stop: £{order.stop_price}
                      </p>
                    )}
                    {order.take_profit_price && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Target: £{order.take_profit_price}
                      </p>
                    )}
                    {order.trail_percent && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Trail: {order.trail_percent}%
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

