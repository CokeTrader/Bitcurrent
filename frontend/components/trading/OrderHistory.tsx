"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { X } from 'lucide-react';

interface OrderHistoryProps {
  symbol?: string;
}

interface Order {
  id: string;
  symbol: string;
  side: string;
  order_type: string;
  price?: string;
  quantity: string;
  filled_quantity: string;
  status: string;
  created_at: string;
}

export function OrderHistory({ symbol }: OrderHistoryProps) {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const data = await apiClient.listOrders(symbol);
        setOrders(data.orders || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [user, symbol]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await apiClient.cancelOrder(orderId);
      // Refresh orders
      const data = await apiClient.listOrders(symbol);
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No open orders</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium text-muted-foreground">Symbol</th>
            <th className="text-left py-2 font-medium text-muted-foreground">Side</th>
            <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
            <th className="text-right py-2 font-medium text-muted-foreground">Price</th>
            <th className="text-right py-2 font-medium text-muted-foreground">Amount</th>
            <th className="text-right py-2 font-medium text-muted-foreground">Filled</th>
            <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
            <th className="text-center py-2 font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border hover:bg-muted/50">
              <td className="py-3 font-mono">{order.symbol}</td>
              <td className="py-3">
                <span className={`font-semibold ${order.side === 'buy' ? 'text-buy' : 'text-sell'}`}>
                  {order.side.toUpperCase()}
                </span>
              </td>
              <td className="py-3 capitalize">{order.order_type}</td>
              <td className="py-3 text-right font-mono">{order.price || 'Market'}</td>
              <td className="py-3 text-right font-mono">{parseFloat(order.quantity).toFixed(4)}</td>
              <td className="py-3 text-right font-mono">{parseFloat(order.filled_quantity).toFixed(4)}</td>
              <td className="py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  order.status === 'filled' ? 'bg-buy/20 text-buy' :
                  order.status === 'cancelled' ? 'bg-muted text-muted-foreground' :
                  'bg-primary/20 text-primary'
                }`}>
                  {order.status}
                </span>
              </td>
              <td className="py-3 text-center">
                {(order.status === 'new' || order.status === 'partial') && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="text-destructive hover:text-destructive/80 transition"
                    title="Cancel order"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



