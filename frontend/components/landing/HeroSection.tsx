"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  TrendingUp,
  CheckCircle2,
  Sparkles
} from "lucide-react"
import { useTickerData } from "@/hooks/use-market-data"
import { PriceChange } from "@/components/ui/price-change"

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
    transition: { duration: 0.6 }
  }
}

const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

export function HeroSection() {
  const { data: tickerData } = useTickerData()

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-primary/5">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-success/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary backdrop-blur-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Now Live in the UK 🇬🇧
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight"
          >
            Trade Crypto
            <br />
            <span className="bg-gradient-to-r from-primary via-success to-primary bg-clip-text text-transparent">
              Simply & Securely
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            The UK's most intuitive cryptocurrency exchange. Buy Bitcoin, Ethereum, and more with zero hassle. FCA compliant, bank-grade security.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button size="xl" asChild className="min-w-[200px] shadow-lg shadow-primary/25">
              <Link href="/auth/register">
                Start Trading Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="min-w-[200px]">
              <Link href="/markets">
                Explore Markets
              </Link>
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground mb-16"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>FCA Registered</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-success" />
              <span>Instant Trading</span>
            </div>
          </motion.div>

          {/* Live Price Ticker */}
          {tickerData && tickerData.length > 0 && (
            <motion.div 
              variants={itemVariants}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tickerData.slice(0, 3).map((ticker: any) => (
                  <motion.div
                    key={ticker.symbol}
                    whileHover={{ scale: 1.05 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-success/20 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-lg">{ticker.symbol}</span>
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        £{ticker.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <PriceChange value={ticker.change24h} size="sm" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/4 left-10 hidden lg:block"
            animate={floatingAnimation}
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </motion.div>

          <motion.div
            className="absolute top-1/3 right-10 hidden lg:block"
            animate={floatingAnimation}
            transition={{ delay: 0.5, duration: 3, repeat: Infinity }}
          >
            <div className="w-20 h-20 rounded-full bg-success/20 backdrop-blur-sm flex items-center justify-center">
              <Zap className="h-10 w-10 text-success" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

