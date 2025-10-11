import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cryptocurrency Prices UK | Live Bitcoin & Ethereum Rates - BitCurrent',
  description: 'Real-time cryptocurrency prices in GBP. Track Bitcoin, Ethereum, Solana & 100+ coins. Advanced charts, market data & instant trading. UK\'s fastest crypto exchange.',
  keywords: ['crypto prices uk', 'bitcoin price gbp', 'ethereum price gbp', 'cryptocurrency prices', 'live crypto rates uk', 'crypto market data'],
  openGraph: {
    title: 'Live Cryptocurrency Prices in GBP | BitCurrent Markets',
    description: 'Track real-time prices for Bitcoin, Ethereum, and 100+ cryptocurrencies in GBP. Professional-grade market data and charts.',
    url: 'https://bitcurrent.co.uk/markets',
  },
  alternates: {
    canonical: 'https://bitcurrent.co.uk/markets',
  },
}

export default function MarketsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

