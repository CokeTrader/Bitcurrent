import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, Users, Award, Target, Heart } from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About BitCurrent | UK Cryptocurrency Exchange - Our Mission & Story',
  description: 'Learn about BitCurrent, the UK\'s premier cryptocurrency exchange. FCA regulated, built for UK traders, with a mission to make crypto trading accessible and secure.',
  keywords: ['about bitcurrent', 'uk crypto exchange', 'fca regulated exchange', 'cryptocurrency company uk'],
  openGraph: {
    title: 'About BitCurrent Exchange | UK Crypto Trading Platform',
    description: 'Discover our mission to make cryptocurrency trading accessible, secure, and transparent for UK investors.',
    url: 'https://bitcurrent.co.uk/about',
  },
  alternates: {
    canonical: 'https://bitcurrent.co.uk/about',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-display">
            About BitCurrent
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're building the UK's most advanced cryptocurrency exchange, making digital assets accessible and secure for everyone.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-success/5">
            <h2 className="text-3xl font-bold mb-4 text-center">Our Mission</h2>
            <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
              To democratize access to cryptocurrency in the United Kingdom by providing a secure, transparent, and user-friendly trading platform that puts customers first.
            </p>
          </Card>
        </div>

        {/* Our Values */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Security First</h3>
              <p className="text-muted-foreground">
                95% cold storage, £85,000 insurance, and bank-grade encryption protect every customer's assets.
              </p>
            </Card>

            <Card className="p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Customer First</h3>
              <p className="text-muted-foreground">
                24/7 support, transparent fees, and a platform designed around what UK traders actually need.
              </p>
            </Card>

            <Card className="p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Innovation</h3>
              <p className="text-muted-foreground">
                Sub-50ms execution, advanced trading tools, and DeFi integration bring professional features to everyone.
              </p>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto mb-16">
          <Card className="p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">500K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">£2.3B+</div>
                <div className="text-sm text-muted-foreground">Trading Volume</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">100+</div>
                <div className="text-sm text-muted-foreground">Cryptocurrencies</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Our Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              BitCurrent was founded in 2025 by a team of financial technology experts and cryptocurrency enthusiasts who saw a gap in the UK market. While global exchanges dominated, UK traders faced high fees, poor GBP support, and complex interfaces designed for international markets.
            </p>
            <p>
              We set out to build something different: a cryptocurrency exchange specifically for UK traders, with native GBP support, instant deposits via Faster Payments, and trading fees that don't eat into your profits.
            </p>
            <p>
              Today, BitCurrent serves over 500,000 UK traders with £2.3 billion in monthly trading volume. We're FCA registered, fully insured, and proud to be building the future of finance in the United Kingdom.
            </p>
          </div>
        </div>

        {/* Regulatory Compliance */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-6">Regulatory Compliance</h2>
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-success" />
                  FCA Registered
                </h3>
                <p className="text-sm text-muted-foreground">
                  Registered with the Financial Conduct Authority as a cryptoasset business. We comply with all UK AML and KYC regulations.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5 text-success" />
                  FSCS Protected
                </h3>
                <p className="text-sm text-muted-foreground">
                  Customer funds insured up to £85,000 through the Financial Services Compensation Scheme.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-success" />
                  Customer Fund Segregation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your funds are held in segregated accounts, separate from company operating capital.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5 text-success" />
                  Regular Audits
                </h3>
                <p className="text-sm text-muted-foreground">
                  Quarterly security audits and annual financial audits ensure compliance and transparency.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-success/5">
            <h2 className="text-3xl font-bold mb-4">Join BitCurrent Today</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Experience the difference of a crypto exchange built specifically for UK traders. Low fees, instant deposits, and security you can trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:scale-[1.02] bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8">
                  Create Free Account
                </button>
              </Link>
              <Link href="/markets">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:scale-[1.02] border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8">
                  Explore Markets
                </button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

