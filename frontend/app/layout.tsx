import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BitCurrent Exchange - UK Cryptocurrency Trading Platform",
  description: "Trade Bitcoin, Ethereum, and other cryptocurrencies with GBP on the UK's premier crypto exchange. FCA regulated, secure, and easy to use.",
  keywords: ["cryptocurrency", "bitcoin", "ethereum", "trading", "exchange", "GBP", "UK", "FCA"],
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
    url: 'https://bitcurrent.exchange',
    title: 'BitCurrent Exchange - UK Cryptocurrency Trading Platform',
    description: 'Trade Bitcoin, Ethereum, and other cryptocurrencies with GBP on the UK\'s premier crypto exchange. FCA regulated, secure, and easy to use.',
    siteName: 'BitCurrent Exchange',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BitCurrent Exchange - UK Cryptocurrency Trading Platform',
    description: 'Trade Bitcoin, Ethereum, and other cryptocurrencies with GBP on the UK\'s premier crypto exchange.',
  },
  alternates: {
    canonical: 'https://bitcurrent.exchange',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "BitCurrent Exchange",
    "description": "UK cryptocurrency exchange for trading Bitcoin, Ethereum, and other digital assets with GBP",
    "url": "https://bitcurrent.exchange",
    "logo": "https://bitcurrent.exchange/favicon.ico",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GB"
    },
    "offers": {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "Cryptocurrency Trading",
        "description": "Trade Bitcoin, Ethereum, BNB, XRP, Solana, Cardano, and other cryptocurrencies"
      }
    },
    "areaServed": "GB",
    "serviceType": "Cryptocurrency Exchange"
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
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
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}



