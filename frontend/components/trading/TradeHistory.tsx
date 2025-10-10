"use client";

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TradeHistoryProps {
  symbol: string;
  compact?: boolean;
  limit?: number;
}

interface Trade {
  id: string;
  symbol: string;
  price: string;
  quantity: string;
  side: string;
  timestamp: string;
}

export function TradeHistory({ symbol, compact = false, limit = 20 }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    // TODO: Fetch real trades from API
    // For now, generate mock data
    const mockTrades: Trade[] = Array.from({ length: limit }, (_, i) => ({
      id: `trade-${i}`,
      symbol,
      price: (45000 + (Math.random() - 0.5) * 1000).toFixed(2),
      quantity: (Math.random() * 2).toFixed(4),
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
    }));

    setTrades(mockTrades);
  }, [symbol, limit]);

  if (compact) {
    return (
      <div className="space-y-1">
        {trades.map((trade) => (
          <div
            key={trade.id}
            className="flex justify-between items-center text-sm py-1 hover:bg-muted/50 rounded px-2"
          >
            <span className={`font-mono ${trade.side === 'buy' ? 'text-buy' : 'text-sell'}`}>
              {parseFloat(trade.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
            </span>
            <span className="font-mono text-muted-foreground">
              {parseFloat(trade.quantity).toFixed(4)}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(trade.timestamp).toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium text-muted-foreground">Time</th>
            <th className="text-left py-2 font-medium text-muted-foreground">Side</th>
            <th className="text-right py-2 font-medium text-muted-foreground">Price</th>
            <th className="text-right py-2 font-medium text-muted-foreground">Amount</th>
            <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const total = parseFloat(trade.price) * parseFloat(trade.quantity);
            return (
              <tr key={trade.id} className="border-b border-border hover:bg-muted/50">
                <td className="py-2 font-mono text-xs">
                  {new Date(trade.timestamp).toLocaleTimeString('en-GB')}
                </td>
                <td className="py-2">
                  <span className={`flex items-center gap-1 ${
                    trade.side === 'buy' ? 'text-buy' : 'text-sell'
                  }`}>
                    {trade.side === 'buy' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {trade.side.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 text-right font-mono">
                  {parseFloat(trade.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 text-right font-mono">{parseFloat(trade.quantity).toFixed(4)}</td>
                <td className="py-2 text-right font-mono">
                  {total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}



