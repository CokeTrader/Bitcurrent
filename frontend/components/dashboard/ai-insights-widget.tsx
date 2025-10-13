'use client';

import { useState, useEffect } from 'react';

export default function AIInsightsWidget() {
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    const mockInsights = [
      { type: 'signal', message: 'BTC showing bullish divergence', confidence: 78 },
      { type: 'pattern', message: 'You have 72% win rate on ETH trades', confidence: 95 },
      { type: 'opportunity', message: 'SOL at support level - potential buy', confidence: 65 }
    ];
    setInsights(mockInsights);
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-4">🤖 AI Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="bg-white/10 rounded p-3">
            <p className="font-medium">{insight.message}</p>
            <p className="text-sm opacity-80">Confidence: {insight.confidence}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

