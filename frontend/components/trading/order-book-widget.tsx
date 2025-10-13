'use client';

import { useState, useEffect } from 'react';

export default function OrderBookWidget({ symbol = 'BTC-GBP' }: { symbol?: string }) {
  const [orderBook, setOrderBook] = useState<any>({ bids: [], asks: [] });

  useEffect(() => {
    const mockData = {
      bids: [
        { price: 39950, amount: 0.5, total: 19975 },
        { price: 39900, amount: 1.2, total: 47880 },
        { price: 39850, amount: 0.8, total: 31880 }
      ],
      asks: [
        { price: 40050, amount: 0.6, total: 24030 },
        { price: 40100, amount: 1.0, total: 40100 },
        { price: 40150, amount: 0.9, total: 36135 }
      ]
    };
    setOrderBook(mockData);
  }, [symbol]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-white font-bold mb-4">Order Book</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-green-400 font-semibold mb-2">Bids</p>
          {orderBook.bids.map((bid: any, i: number) => (
            <div key={i} className="text-sm text-green-300 flex justify-between">
              <span>£{bid.price.toFixed(2)}</span>
              <span>{bid.amount}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="text-red-400 font-semibold mb-2">Asks</p>
          {orderBook.asks.map((ask: any, i: number) => (
            <div key={i} className="text-sm text-red-300 flex justify-between">
              <span>£{ask.price.toFixed(2)}</span>
              <span>{ask.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

