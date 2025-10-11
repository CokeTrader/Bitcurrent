import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BitCurrent Exchange - UK Crypto Trading',
    short_name: 'BitCurrent',
    description: 'Trade Bitcoin, Ethereum, and other cryptocurrencies with GBP on the UK\'s premier crypto exchange.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0E27',
    theme_color: '#0052FF',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['finance', 'business'],
    shortcuts: [
      {
        name: 'Markets',
        url: '/markets',
        description: 'View cryptocurrency markets',
      },
      {
        name: 'Trade',
        url: '/trade/BTC-GBP',
        description: 'Start trading Bitcoin',
      },
      {
        name: 'Portfolio',
        url: '/dashboard',
        description: 'View your portfolio',
      },
    ],
  }
}

