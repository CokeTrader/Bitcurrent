import type { Metadata } from "next";
import { Sora, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";

// Sora - Modern, unique, geometric (used by top fintech)
const sora = Sora({ 
  subsets: ["latin"],
  variable: '--font-sora',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Space Grotesk - Distinctive, tech-forward (Stripe, Linear)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Buy Bitcoin & Crypto in UK | BitCurrent Exchange - FCA Regulated",
  description: "Trade Bitcoin, Ethereum & 100+ cryptocurrencies with GBP. FCA regulated, £85k insured, 0.1% fees. Instant deposits & 95% cold storage. Start trading today.",
  keywords: ["buy bitcoin uk", "crypto exchange uk", "buy ethereum uk", "cryptocurrency trading uk", "buy crypto with gbp", "fca regulated crypto exchange", "bitcoin uk", "ethereum uk"],
  authors: [{ name: "BitCurrent Exchange" }],
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://bitcurrent.co.uk',
    title: 'Buy Bitcoin & Crypto in UK | BitCurrent Exchange - FCA Regulated',
    description: 'Trade Bitcoin, Ethereum & 100+ cryptocurrencies with GBP. FCA regulated, £85k insured, 0.1% fees. Instant deposits & 95% cold storage.',
    siteName: 'BitCurrent Exchange',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Bitcoin & Crypto in UK | BitCurrent Exchange',
    description: 'Trade Bitcoin, Ethereum & 100+ cryptocurrencies with GBP. FCA regulated, £85k insured, instant deposits.',
  },
  alternates: {
    canonical: 'https://bitcurrent.co.uk',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Enhanced structured data for better SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["FinancialService", "Organization"],
    "name": "BitCurrent Exchange",
    "legalName": "BitCurrent Ltd",
    "description": "UK cryptocurrency exchange for trading Bitcoin, Ethereum, and other digital assets with GBP. FCA regulated with £85,000 insurance protection.",
    "url": "https://bitcurrent.co.uk",
    "logo": {
      "@type": "ImageObject",
      "url": "https://bitcurrent.co.uk/favicon.ico",
      "width": 100,
      "height": 100
    },
    "image": "https://bitcurrent.co.uk/favicon.ico",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GB",
      "addressLocality": "London",
      "addressRegion": "England",
      "postalCode": "EC2A",
      "streetAddress": "London"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 51.5074,
      "longitude": -0.1278
    },
    "areaServed": {
      "@type": "Country",
      "name": "United Kingdom",
      "alternateName": "UK"
    },
    "serviceType": ["Cryptocurrency Exchange", "Digital Asset Trading", "Crypto Staking Platform"],
    "priceRange": "£",
    "currenciesAccepted": ["GBP", "EUR", "USD"],
    "paymentAccepted": ["Bank Transfer", "Debit Card", "Credit Card"],
    "foundingDate": "2025",
    "slogan": "Trade Crypto Like a Pro",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.7,
      "reviewCount": 1250,
      "bestRating": 5,
      "worstRating": 1
    },
    "offers": {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Cryptocurrency Trading",
        "description": "Trade Bitcoin, Ethereum, BNB, XRP, Solana, Cardano, and 100+ cryptocurrencies with GBP",
        "provider": {
          "@type": "Organization",
          "name": "BitCurrent Exchange"
        }
      },
      "availability": "https://schema.org/InStock",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "GBP",
        "price": 0,
        "description": "0.1% trading fee"
      }
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Cryptocurrency Trading Pairs",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Bitcoin Trading (BTC/GBP)"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Ethereum Trading (ETH/GBP)"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Solana Trading (SOL/GBP)"
          }
        }
      ]
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "areaServed": "GB",
      "availableLanguage": ["English"]
    },
    "sameAs": [
      "https://twitter.com/bitcurrent",
      "https://linkedin.com/company/bitcurrent"
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${sora.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Structured Data for LLMs and Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Allow AI crawlers to understand content */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        {/* Metadata Base for production */}
        <link rel="canonical" href="https://bitcurrent.co.uk" />
      </head>
      <body className={sora.className}>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}



