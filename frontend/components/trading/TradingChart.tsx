"use client";

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';

interface TradingChartProps {
  symbol: string;
}

export function TradingChart({ symbol }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#1F2937' },
        horzLines: { color: '#1F2937' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Sample data (TODO: fetch real data from API)
    const generateSampleData = () => {
      const data = [];
      let basePrice = 45000;
      const now = Date.now() / 1000;
      
      for (let i = 100; i >= 0; i--) {
        const time = now - i * 3600; // Hourly candles
        const volatility = 500;
        const open = basePrice + (Math.random() - 0.5) * volatility;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * 200;
        const low = Math.min(open, close) - Math.random() * 200;
        
        data.push({
          time: time as any,
          open,
          high,
          low,
          close,
        });
        
        basePrice = close;
      }
      return data;
    };

    candlestickSeries.setData(generateSampleData());

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{symbol}</h2>
        <div className="flex gap-2 text-xs">
          {['1m', '5m', '15m', '1h', '1d'].map((interval) => (
            <button
              key={interval}
              className="px-3 py-1 rounded bg-muted hover:bg-muted/80 transition"
            >
              {interval}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
}



