import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bitcurrent.vercel.app'
  
  // Static pages
  const routes = [
    '',
    '/markets',
    '/auth/register',
    '/auth/login',
    '/deposit',
    '/faq',
    '/about',
    '/fees',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/markets' ? 'hourly' : 'daily' as any,
    priority: route === '' || route === '/auth/register' ? 1 : 0.8,
  }))

  // Trading pairs
  const cryptos = ['BTC', 'ETH', 'SOL', 'ADA', 'DOGE', 'XRP', 'DOT', 'AVAX']
  const tradingPages = cryptos.map((symbol) => ({
    url: `${baseUrl}/trade/${symbol}-GBP`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as any,
    priority: symbol === 'BTC' || symbol === 'ETH' ? 0.9 : 0.7,
  }))

  return [...routes, ...tradingPages]
}
