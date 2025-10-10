"use client";

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api/client';

interface OrderbookProps {
  symbol: string;
  depth?: number;
}

interface PriceLevel {
  price: string;
  quantity: string;
  total?: number;
}

interface OrderbookData {
  symbol: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: string;
}

export function LiveOrderbook({ symbol = 'BTC-GBP', depth = 15 }: OrderbookProps) {
  const [orderbook, setOrderbook] = useState<{ bids: PriceLevel[], asks: PriceLevel[] }>({
    bids: [],
    asks: [],
  });
  const [lastTrade, setLastTrade] = useState<any>(null);
  const [spread, setSpread] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial orderbook
  useEffect(() => {
    const fetchOrderbook = async () => {
      try {
        const data: OrderbookData = await apiClient.getOrderbook(symbol, depth);
        
        const bids = data.bids.map(([price, quantity]) => ({
          price,
          quantity,
        }));

        const asks = data.asks.map(([price, quantity]) => ({
          price,
          quantity,
        }));

        setOrderbook({ bids, asks });
      } catch (error) {
        console.error('Failed to fetch orderbook:', error);
      }
    };

    fetchOrderbook();
    const interval = setInterval(fetchOrderbook, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [symbol, depth]);

  // Calculate spread
  useEffect(() => {
    if (orderbook.bids.length > 0 && orderbook.asks.length > 0) {
      const bestBid = parseFloat(orderbook.bids[0].price);
      const bestAsk = parseFloat(orderbook.asks[0].price);
      setSpread(bestAsk - bestBid);
    }
  }, [orderbook]);

  // WebSocket connection for real-time updates (TODO: implement when backend ready)
  useEffect(() => {
    // const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws');
    // wsRef.current = ws;

    // ws.onopen = () => {
    //   ws.send(JSON.stringify({
    //     type: 'subscribe',
    //     channels: ['orderbook', 'trades'],
    //     symbols: [symbol]
    //   }));
    // };

    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'orderbook_update') {
    //     // Update orderbook
    //   }
    // };

    // return () => ws.close();
  }, [symbol]);

  const PriceLevel = ({ price, size, total, side, maxSize }: {
    price: string;
    size: number;
    total: number;
    side: 'bid' | 'ask';
    maxSize: number;
  }) => {
    const percentage = (size / maxSize) * 100;
    
    return (
      <div className="flex items-center h-7 hover:bg-muted/50 relative orderbook-row cursor-pointer">
        <div 
          className={`absolute h-full right-0 ${
            side === 'bid' ? 'bg-buy/10' : 'bg-sell/10'
          }`}
          style={{ width: `${percentage}%` }}
        />
        <div className="flex justify-between w-full px-2 relative z-10">
          <span className={`font-mono text-sm ${side === 'bid' ? 'text-buy' : 'text-sell'}`}>
            {parseFloat(price).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="font-mono text-sm">{size.toFixed(4)}</span>
          <span className="font-mono text-sm text-muted-foreground">{total.toFixed(4)}</span>
        </div>
      </div>
    );
  };

  // Process levels with cumulative totals
  const processLevels = (levels: PriceLevel[]) => {
    let cumulative = 0;
    return levels.map(({ price, quantity }) => {
      const size = parseFloat(quantity);
      cumulative += size;
      return { price, size, total: cumulative };
    });
  };

  const bidLevels = processLevels(orderbook.bids.slice(0, depth));
  const askLevels = processLevels(orderbook.asks.slice(0, depth));
  const maxSize = Math.max(
    ...bidLevels.map(l => l.size),
    ...askLevels.map(l => l.size),
    1
  );

  const midPrice = orderbook.bids.length > 0 && orderbook.asks.length > 0
    ? ((parseFloat(orderbook.bids[0].price) + parseFloat(orderbook.asks[0].price)) / 2).toFixed(2)
    : '---';

  return (
    <div className="bg-card rounded-lg border border-border p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Orderbook</h2>
        <div className="text-sm">
          Spread: <span className="font-mono text-muted-foreground">
            {spread.toFixed(2)} GBP
          </span>
        </div>
      </div>

      {lastTrade && (
        <div className="mb-4 p-2 bg-muted rounded text-sm">
          <span>Last: </span>
          <span className={`font-mono font-semibold ${
            lastTrade.side === 'buy' ? 'text-buy' : 'text-sell'
          }`}>
            {lastTrade.price} @ {lastTrade.quantity}
          </span>
        </div>
      )}

      <div className="space-y-2">
        {/* Headers */}
        <div className="flex justify-between px-2 text-xs text-muted-foreground font-semibold border-b border-border pb-2">
          <span>Price (GBP)</span>
          <span>Size</span>
          <span>Total</span>
        </div>

        {/* Asks (reversed for display) */}
        <div className="custom-scrollbar max-h-64 overflow-y-auto">
          {askLevels.slice().reverse().map((level, i) => (
            <PriceLevel
              key={`ask-${i}`}
              price={level.price}
              size={level.size}
              total={level.total}
              side="ask"
              maxSize={maxSize}
            />
          ))}
        </div>

        {/* Mid price indicator */}
        <div className="flex justify-center py-3 border-y border-border bg-muted/30">
          <span className="text-2xl font-bold font-mono">
            {midPrice}
          </span>
        </div>

        {/* Bids */}
        <div className="custom-scrollbar max-h-64 overflow-y-auto">
          {bidLevels.map((level, i) => (
            <PriceLevel
              key={`bid-${i}`}
              price={level.price}
              size={level.size}
              total={level.total}
              side="bid"
              maxSize={maxSize}
            />
          ))}
        </div>
      </div>
    </div>
  );
}



