'use client';

import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AssetPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export default function AnimatedPriceTicker() {
  const [assets, setAssets] = useState<AssetPrice[]>([
    { symbol: 'BTC', name: 'Bitcoin', price: 67234.50, change24h: 2.5 },
    { symbol: 'ETH', name: 'Ethereum', price: 3567.89, change24h: -1.2 },
    { symbol: 'SOL', name: 'Solana', price: 145.67, change24h: 5.8 },
    { symbol: 'ADA', name: 'Cardano', price: 0.52, change24h: 3.2 },
    { symbol: 'DOT', name: 'Polkadot', price: 7.89, change24h: -0.5 },
    { symbol: 'MATIC', name: 'Polygon', price: 0.89, change24h: 4.1 },
    { symbol: 'LINK', name: 'Chainlink', price: 12.34, change24h: 2.8 },
    { symbol: 'UNI', name: 'Uniswap', price: 6.78, change24h: 1.5 },
    { symbol: 'AVAX', name: 'Avalanche', price: 34.56, change24h: -2.1 },
    { symbol: 'ATOM', name: 'Cosmos', price: 9.87, change24h: 3.7 },
    { symbol: 'XRP', name: 'Ripple', price: 0.56, change24h: 1.1 },
    { symbol: 'LTC', name: 'Litecoin', price: 89.12, change24h: 0.8 },
    { symbol: 'BCH', name: 'Bitcoin Cash', price: 234.56, change24h: -1.8 },
    { symbol: 'ALGO', name: 'Algorand', price: 0.34, change24h: 2.3 },
    { symbol: 'XLM', name: 'Stellar', price: 0.12, change24h: 4.5 }
  ]);

  const tickerRef = useRef<HTMLDivElement>(null);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => prev.map(asset => ({
        ...asset,
        price: asset.price * (1 + (Math.random() - 0.5) * 0.001), // 0.1% random movement
        change24h: asset.change24h + (Math.random() - 0.5) * 0.1
      })));
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Duplicate assets for seamless loop
  const displayAssets = [...assets, ...assets];

  return (
    <div className="bg-gray-900 border-y border-gray-800 py-3 overflow-hidden">
      <div className="relative">
        <div
          ref={tickerRef}
          className="flex gap-8 animate-scroll-rtl whitespace-nowrap"
          style={{
            animation: 'scroll-rtl 60s linear infinite'
          }}
        >
          {displayAssets.map((asset, index) => {
            const isPositive = asset.change24h >= 0;

            return (
              <div
                key={`${asset.symbol}-${index}`}
                className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">
                    {asset.symbol}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {asset.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-sm">
                    £{asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>

                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-rtl {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-rtl {
          animation: scroll-rtl 60s linear infinite;
        }
        .animate-scroll-rtl:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

