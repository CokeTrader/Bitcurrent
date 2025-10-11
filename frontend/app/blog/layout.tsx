import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crypto Blog UK | Bitcoin & Cryptocurrency Trading Guides - BitCurrent',
  description: 'Learn about cryptocurrency trading, Bitcoin investment, UK crypto taxes, and blockchain technology. Expert guides, tutorials, and news for UK investors.',
  keywords: ['crypto blog uk', 'bitcoin guides', 'cryptocurrency tutorials', 'crypto news uk', 'bitcoin trading guide'],
  openGraph: {
    title: 'Crypto Trading Guides & News | BitCurrent Blog',
    description: 'Expert cryptocurrency guides, Bitcoin trading strategies, and UK crypto news.',
    url: 'https://bitcurrent.co.uk/blog',
  },
  alternates: {
    canonical: 'https://bitcurrent.co.uk/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

