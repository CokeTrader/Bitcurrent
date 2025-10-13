'use client';

/**
 * Mobile-First Trading UI
 * Optimized for smartphones
 */

export default function MobileFirstUI() {
  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">BitCurrent</h1>
        <div className="flex space-x-4">
          <button className="text-green-400">£10.50</button>
          <button>☰</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 grid grid-cols-3 gap-2">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-lg font-bold">£5,420</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Today</p>
          <p className="text-lg font-bold text-green-400">+£125</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">BTC</p>
          <p className="text-lg font-bold">0.125</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-green-600 py-4 rounded-lg font-semibold">
            Buy
          </button>
          <button className="bg-red-600 py-4 rounded-lg font-semibold">
            Sell
          </button>
        </div>
      </div>

      {/* Asset List */}
      <div className="p-4">
        <h2 className="font-bold mb-3">Assets</h2>
        <div className="space-y-2">
          {['BTC', 'ETH', 'SOL'].map(asset => (
            <div key={asset} className="bg-gray-800 rounded-lg p-4 flex justify-between">
              <div>
                <p className="font-semibold">{asset}</p>
                <p className="text-sm text-gray-400">0.125</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">£5,000</p>
                <p className="text-sm text-green-400">+2.5%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 flex justify-around">
        <button className="flex flex-col items-center">
          <span>🏠</span>
          <span className="text-xs mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center">
          <span>📈</span>
          <span className="text-xs mt-1">Markets</span>
        </button>
        <button className="flex flex-col items-center">
          <span>💼</span>
          <span className="text-xs mt-1">Portfolio</span>
        </button>
        <button className="flex flex-col items-center">
          <span>⚙️</span>
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </div>
  );
}

