import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ: How to Buy Crypto in UK | BitCurrent Exchange Help Center',
  description: 'Get answers to common questions about buying Bitcoin in the UK, fees, security, FCA regulation & withdrawals. Complete beginner\'s guide to crypto trading.',
  keywords: ['crypto faq uk', 'how to buy bitcoin uk', 'crypto exchange questions', 'bitcurrent help', 'cryptocurrency faq', 'crypto trading guide'],
  openGraph: {
    title: 'Frequently Asked Questions | BitCurrent Exchange',
    description: 'Everything you need to know about trading cryptocurrency in the UK. Security, fees, regulation, and more.',
    url: 'https://bitcurrent.co.uk/faq',
  },
  alternates: {
    canonical: 'https://bitcurrent.co.uk/faq',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

