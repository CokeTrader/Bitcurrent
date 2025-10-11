import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Cryptocurrency with GBP | BitCurrent Exchange',
  description: 'Advanced cryptocurrency trading platform. Buy and sell Bitcoin, Ethereum, and 100+ coins with GBP. Real-time charts, advanced orders, instant execution.',
  keywords: ['trade crypto uk', 'buy bitcoin', 'sell ethereum', 'crypto trading platform', 'advanced crypto trading'],
  openGraph: {
    title: 'Trade Crypto with GBP | BitCurrent',
    description: 'Professional cryptocurrency trading with advanced charts and instant execution.',
    url: 'https://bitcurrent.co.uk/trade',
  },
}

export default function TradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

