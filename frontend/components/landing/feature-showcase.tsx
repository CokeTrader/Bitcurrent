'use client';

import { motion } from 'framer-motion';

export default function FeatureShowcase() {
  const features = [
    { icon: '💰', title: 'Real Bitcoin Trading', desc: 'Deposit £10, buy real BTC' },
    { icon: '🤖', title: 'Auto Trading Bots', desc: 'DCA, Grid, RSI strategies' },
    { icon: '📊', title: 'Advanced Analytics', desc: 'Professional insights' },
    { icon: '🏛️', title: 'UK Tax Reports', desc: 'HMRC-compliant CGT' },
    { icon: '👥', title: 'Copy Trading', desc: 'Follow top traders' },
    { icon: '💳', title: 'Crypto Card', desc: '2% cashback in BTC' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
        >
          <div className="text-4xl mb-3">{f.icon}</div>
          <h3 className="text-xl font-bold mb-2">{f.title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

