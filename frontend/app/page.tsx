"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AssetIcon } from "@/components/ui/asset-icon"
import { PriceChange } from "@/components/ui/price-change"
import { UrgencyBanner } from "@/components/ui/urgency-banner"
import { SocialProof } from "@/components/ui/social-proof"
import { MobileCTA } from "@/components/ui/mobile-cta"
import { LivePriceTicker } from "@/components/ui/live-price-ticker"
import { RiskWarningBanner } from "@/components/ui/risk-warning-banner"
import { useTickerData } from "@/hooks/use-market-data"
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  LineChart,
  Lock,
  TrendingUp,
  Smartphone,
  Globe,
  Award,
  CheckCircle2,
  Sparkles
} from "lucide-react"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  }
}

export default function HomePage() {
  const { data: tickerData } = useTickerData()
  const [mounted, setMounted] = React.useState(false)
  const router = useRouter()

  // Check if user is logged in and redirect to dashboard
  React.useEffect(() => {
    setMounted(true)
    
    // If user is logged in, redirect to dashboard
    if (typeof window !== 'undefined') {
      const hasCookie = document.cookie.includes('session_token')
      const hasLocalStorage = localStorage.getItem('token') !== null
      
      if (hasCookie || hasLocalStorage) {
        router.push('/dashboard')
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <RiskWarningBanner />
      <LivePriceTicker />
      <MobileCTA />
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5 animate-gradient opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 right-20 opacity-10 animate-pulse">
        <div className="h-64 w-64 rounded-full bg-gradient-to-br from-primary to-success blur-3xl" />
      </div>

      <div className="absolute bottom-20 left-20 opacity-10 animate-pulse">
        <div className="h-48 w-48 rounded-full bg-gradient-to-br from-success to-primary blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-32 pb-20">
          <motion.div
            className="text-center max-w-5xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Social Proof - Above fold */}
            <SocialProof />
            
            {/* Urgency Banner */}
            <UrgencyBanner />
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-sm font-semibold text-green-600 dark:text-green-400 mb-6 shadow-lg">
                <Sparkles className="h-4 w-4 animate-pulse" />
                🚀 Live Now - Join 100+ Early Users
              </span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-6xl md:text-7xl font-bold tracking-tight mb-8 font-display"
            >
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                Save 6x on Crypto Fees
              </span>
              <br />
              <span className="text-foreground text-5xl md:text-6xl">Trade Bitcoin for 0.25%</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              UK cryptocurrency broker with <span className="text-green-600 dark:text-green-400 font-semibold">0.25% fees</span> — 6x cheaper than Coinbase. 
              Instant GBP deposits via Stripe. Start trading in 2 minutes.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Link href="/auth/register">
                <Button size="xl" className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
                  <span className="relative z-10 flex items-center gap-2 font-bold">
                    Get £10 Free - Start Now
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link href="/markets">
                <Button size="xl" variant="outline" className="group">
                  Explore Markets
                  <TrendingUp className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>UK Crypto Broker</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>£85,000 Insurance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>95% Cold Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Sub-50ms Execution</span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Live Price Ticker */}
        {mounted && tickerData && (
          <section className="border-y border-border bg-card/50 backdrop-blur-sm py-6 mb-20">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-8 overflow-x-auto scrollbar-hide"
              >
                {tickerData.slice(0, 8).map((market, i) => (
                  <motion.div
                    key={market.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-3 min-w-fit cursor-pointer"
                  >
                    <AssetIcon symbol={market.baseAsset} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold">{market.baseAsset}</span>
                        <span className="font-mono text-lg font-bold">
                          £{market.price.toLocaleString('en-GB')}
                        </span>
                      </div>
                      <PriceChange value={market.change24h} type="percentage" size="sm" animate />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Sub-50ms order execution. Your trades happen instantly at the best available price.",
                gradient: "from-primary to-success"
              },
              {
                icon: Shield,
                title: "Bank-Grade Security",
                description: "95% cold storage, insurance up to £85,000, and military-grade encryption protect your assets.",
                gradient: "from-success to-primary"
              },
              {
                icon: LineChart,
                title: "Professional Tools",
                description: "TradingView charts, advanced orders, and real-time data give you a competitive edge.",
                gradient: "from-primary to-danger"
              }
            ].map((feature, i) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="p-8 h-full hover:shadow-2xl transition-all duration-500 group glass border-border/50">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6`}
                  >
                    <div className="h-full w-full rounded-2xl bg-background flex items-center justify-center">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4 font-display">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { label: "Trading Volume", value: "£2.3B+", sublabel: "24h volume" },
              { label: "Active Users", value: "500K+", sublabel: "Trusted traders" },
              { label: "Assets Listed", value: "100+", sublabel: "Cryptocurrencies" },
              { label: "Uptime", value: "99.9%", sublabel: "Always available" }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="text-center"
              >
                <div className="text-5xl md:text-6xl font-bold font-mono bg-gradient-to-br from-primary to-success bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <Card className="p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-success/10 to-primary/10 animate-gradient" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display">
                  Ready to Start Trading?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of traders who trust BitCurrent for fast, secure cryptocurrency trading.
                </p>
                <Link href="/auth/register">
                  <Button size="xl" className="group">
                    <span className="flex items-center gap-2">
                      Create Free Account
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </section>
      </div>
    </div>
  )
}

