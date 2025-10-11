/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // API Proxy for backend communication
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://aa566433839ec4bfe8113014ed98d8b9-1852355696.eu-west-2.elb.amazonaws.com/api/v1/:path*',
      },
    ]
  },
  
  // Enable PWA
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable React strict mode
  reactStrictMode: true,

  // Optimize font loading
  optimizeFonts: true,

  // Compress output
  compress: true,

  // Power optimization
  poweredByHeader: false,

  // External packages that need transpiling
  transpilePackages: ['@rainbow-me/rainbowkit'],
}

module.exports = nextConfig
