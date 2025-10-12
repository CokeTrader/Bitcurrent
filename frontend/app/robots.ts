import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/', '/settings/'],
      },
    ],
    sitemap: 'https://bitcurrent.co.uk/sitemap.xml',
    host: 'https://bitcurrent.co.uk',
  }
}

