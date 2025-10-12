import Script from 'next/script'

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BitCurrent Exchange",
    "alternateName": "BitCurrent",
    "url": "https://bitcurrent.co.uk",
    "logo": "https://bitcurrent.co.uk/logo.png",
    "description": "UK's premier cryptocurrency exchange for buying Bitcoin, Ethereum, and altcoins with GBP. FCA registered and fully compliant.",
    "sameAs": [
      "https://twitter.com/bitcurrent",
      "https://www.linkedin.com/company/bitcurrent"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+44-20-XXXX-XXXX",
      "contactType": "Customer Service",
      "areaServed": "GB",
      "availableLanguage": "English"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GB",
      "addressRegion": "England"
    }
  }

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BitCurrent Exchange",
    "url": "https://bitcurrent.co.uk",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://bitcurrent.co.uk/markets?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FinancialServiceSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "BitCurrent Exchange",
    "image": "https://bitcurrent.co.uk/logo.png",
    "url": "https://bitcurrent.co.uk",
    "telephone": "+44-20-XXXX-XXXX",
    "priceRange": "0.1% trading fees",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 51.5074,
      "longitude": -0.1278
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "125"
    }
  }

  return (
    <Script
      id="financial-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

