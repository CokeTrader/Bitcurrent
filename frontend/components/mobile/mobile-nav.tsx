'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, TrendingUp, Wallet, User, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/trade', label: 'Trade', icon: TrendingUp },
    { href: '/deposit', label: 'Wallet', icon: Wallet },
    { href: '/settings', label: 'Account', icon: User }
  ];

  return (
    <>
      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden z-50">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Menu Button (Top) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 lg:hidden z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-900 dark:text-white" />
        ) : (
          <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
        )}
      </button>

      {/* Full-Screen Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-40 lg:hidden overflow-y-auto">
          <div className="px-6 py-20">
            <nav className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/markets', label: 'Markets' },
                { href: '/trade/BTCUSD', label: 'Trade Bitcoin' },
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/deposit', label: 'Deposit' },
                { href: '/orders', label: 'Orders' },
                { href: '/earn', label: 'Earn' },
                { href: '/referrals', label: 'Referrals' },
                { href: '/settings', label: 'Settings' },
                { href: '/faq', label: 'FAQ' },
                { href: '/support', label: 'Support' }
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-lg font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/auth/logout"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 rounded-lg text-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

