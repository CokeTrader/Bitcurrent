import Link from "next/link"
import { ArrowRight, Shield, Zap, LineChart, Users, DollarSign, TrendingUp } from "lucide-react"
import { LinkButton } from "@/components/ui/link-button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PriceTicker } from "@/components/ui/price-ticker"
import { Header } from "@/components/layout/header"

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Live Price Ticker with REAL CoinGecko data */}
      <PriceTicker />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              BitCurrent
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl">
            The UK's premier cryptocurrency exchange. Trade Bitcoin, Ethereum, and more with GBP. 
            Fast, secure, and FCA compliant.
          </p>

          <div className="flex gap-4 mt-8">
            <LinkButton href="/auth/register" size="lg" className="flex items-center gap-2">
              Get Started <ArrowRight className="h-5 w-5" />
            </LinkButton>
            <LinkButton href="/trade/BTC-GBP" size="lg" variant="outline">
              Start Trading
            </LinkButton>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ultra-Low Latency</h3>
              <p className="text-muted-foreground">
                Sub-2ms matching engine ensures your orders execute instantly at the best prices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bank-Grade Security</h3>
              <p className="text-muted-foreground">
                Multi-sig cold storage, insurance coverage, and FCA-compliant operations protect your assets.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <LineChart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional Tools</h3>
              <p className="text-muted-foreground">
                Advanced charts, real-time data, and institutional-grade trading features.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground mb-2">Already have an account?</p>
          <Link
            href="/auth/login"
            className="text-primary hover:underline font-semibold"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  )
}

