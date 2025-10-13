'use client';

/**
 * TradingView Advanced Charts Integration
 * 
 * Professional charting with:
 * - Real-time price updates
 * - Technical indicators
 * - Drawing tools
 * - Multiple timeframes
 */

import { useEffect, useRef } from 'react';

export default function TradingViewChart({ symbol = 'BTCUSD' }: { symbol?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // TradingView widget configuration
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          width: '100%',
          height: 600,
          symbol: `COINBASE:${symbol}`,
          interval: '60',
          timezone: 'Europe/London',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_chart',
          studies: [
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies',
            'MASimple@tv-basicstudies'
          ]
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [symbol]);

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      <div id="tradingview_chart" ref={containerRef} />
    </div>
  );
}

