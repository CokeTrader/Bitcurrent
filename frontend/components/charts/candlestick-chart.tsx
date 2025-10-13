'use client';

import { useEffect, useRef } from 'react';

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function CandlestickChart({ pair = 'BTC/USD' }: { pair?: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TradingView widget initialization
    if (typeof window !== 'undefined' && chartContainerRef.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).TradingView) {
          new (window as any).TradingView.widget({
            container_id: 'tradingview_chart',
            autosize: true,
            symbol: pair.replace('/', ''),
            interval: '15',
            timezone: 'Europe/London',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#1F2937',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            studies: [
              'RSI@tv-basicstudies',
              'MASimple@tv-basicstudies'
            ],
            show_popup_button: true,
            popup_width: '1000',
            popup_height: '650'
          });
        }
      };
      document.head.appendChild(script);
    }
  }, [pair]);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
      <div id="tradingview_chart" ref={chartContainerRef} style={{ height: '100%' }} />
    </div>
  );
}

