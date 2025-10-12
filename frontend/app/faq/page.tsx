"use client"

import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click 'Sign Up' and enter your email. Verify your email, complete KYC (2 minutes), and you're ready to trade! New users get £10 free Bitcoin."
      },
      {
        q: "What is the £10 bonus?",
        a: "All new verified users receive £10 in Bitcoin absolutely free. No deposit required. Complete verification to claim your bonus instantly."
      },
      {
        q: "How long does verification take?",
        a: "KYC verification typically takes 2-5 minutes. You'll need a government ID (passport or driving license) and a selfie. Approval is usually instant."
      }
    ]
  },
  {
    category: "Trading & Fees",
    questions: [
      {
        q: "What are your trading fees?",
        a: "We charge 0.25% per trade - 6x cheaper than Coinbase. Example: £1,000 trade = only £2.50 fee. No hidden charges, no withdrawal fees."
      },
      {
        q: "What cryptocurrencies can I trade?",
        a: "We support Bitcoin (BTC), Ethereum (ETH), Solana (SOL), XRP, Cardano (ADA), Dogecoin (DOGE), Polkadot (DOT), and Avalanche (AVAX)."
      },
      {
        q: "What is a market order?",
        a: "A market order executes immediately at the current market price. It's the fastest way to buy or sell crypto. Your order fills within seconds."
      },
      {
        q: "Can I set price alerts?",
        a: "Yes! Set custom price alerts for any cryptocurrency. We'll email you when your target price is reached. Perfect for timing your trades."
      }
    ]
  },
  {
    category: "Deposits & Withdrawals",
    questions: [
      {
        q: "How do I deposit money?",
        a: "Click 'Deposit' → Choose 'Instant Deposit (Stripe)' → Enter amount → Pay with card. Funds appear in your account immediately. Minimum £10."
      },
      {
        q: "Are there deposit fees?",
        a: "No! We don't charge deposit fees. Stripe may charge a small processing fee (typically 1.4% + 20p), which is standard for card payments."
      },
      {
        q: "How long do withdrawals take?",
        a: "Bank withdrawals: 1-2 business days. Crypto withdrawals: 10-30 minutes depending on network congestion. All withdrawals are free."
      },
      {
        q: "What's the minimum withdrawal?",
        a: "Minimum withdrawal is £10 for GBP, or equivalent in crypto. This helps keep transaction costs low for everyone."
      }
    ]
  },
  {
    category: "Security & Safety",
    questions: [
      {
        q: "Is my money safe?",
        a: "Yes. We use bank-grade security: 95% of funds in cold storage, 2FA authentication, SSL encryption, and regular security audits. Your funds are protected."
      },
      {
        q: "What is cold storage?",
        a: "Cold storage keeps crypto offline in secure vaults, protected from hackers. Only 5% stays online for instant trading. Industry best practice."
      },
      {
        q: "Do you have 2FA?",
        a: "Yes, we support 2-Factor Authentication via SMS, email, and authenticator apps. We strongly recommend enabling 2FA for maximum security."
      },
      {
        q: "What if I forget my password?",
        a: "Click 'Forgot Password' on the login page. We'll send a reset link to your email. For security, only you can reset your password."
      }
    ]
  },
  {
    category: "Regulations & Compliance",
    questions: [
      {
        q: "Are you FCA registered?",
        a: "We operate as a UK crypto broker. While FCA registration is in progress, we follow all UK crypto regulations and AML/KYC requirements."
      },
      {
        q: "Why do you need my ID?",
        a: "UK law requires all crypto platforms to verify user identity (KYC). This prevents fraud, money laundering, and protects all users."
      },
      {
        q: "Is crypto trading risky?",
        a: "Yes. Crypto prices are highly volatile. Only invest what you can afford to lose. 75% of retail traders lose money. Trade responsibly."
      }
    ]
  },
  {
    category: "Technical Support",
    questions: [
      {
        q: "How do I contact support?",
        a: "Email us at support@bitcurrent.co.uk. We typically respond within 2-4 hours. For urgent issues, use the live chat on your dashboard."
      },
      {
        q: "Why is my order pending?",
        a: "Orders may pend during high volatility or if there's insufficient balance. Check your available funds and ensure you have enough for the trade + fees."
      },
      {
        q: "Can I cancel an order?",
        a: "Market orders execute instantly and can't be cancelled. Limit orders (coming soon) can be cancelled anytime before they fill."
      }
    ]
  }
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFAQs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about trading on BitCurrent
            </p>
          </div>

          {/* Search */}
          <Card className="p-4 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {filteredFAQs.map((category, idx) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <h2 className="text-2xl font-bold mb-4">{category.category}</h2>
                <Card className="p-6">
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, qIdx) => (
                      <AccordionItem key={qIdx} value={`${idx}-${qIdx}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Still Need Help */}
          <Card className="mt-12 p-8 text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here for you
            </p>
            <a
              href="mailto:support@bitcurrent.co.uk"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Email Support →
            </a>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
