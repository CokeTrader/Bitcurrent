"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Shield, 
  Zap, 
  LineChart,
  Lock,
  Smartphone,
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  Globe
} from "lucide-react"
import { Card } from "@/components/ui/card"

const features = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your assets are protected with military-grade encryption, 2FA authentication, and cold storage for crypto holdings.",
    color: "text-blue-500"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Execute trades in milliseconds with our high-performance matching engine. No lag, no delays, just instant execution.",
    color: "text-yellow-500"
  },
  {
    icon: DollarSign,
    title: "0.25% Trading Fees",
    description: "6x cheaper than Coinbase. Save £15 on every £1,000 trade. No hidden fees, no surprises.",
    color: "text-green-500"
  },
  {
    icon: LineChart,
    title: "Advanced Charts",
    description: "Professional-grade TradingView charts with 50+ technical indicators, drawing tools, and multi-timeframe analysis.",
    color: "text-purple-500"
  },
  {
    icon: Lock,
    title: "Secure & Compliant",
    description: "UK-based crypto broker. Bank-grade security with cold storage. Your funds protected by industry best practices.",
    color: "text-red-500"
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Trade on the go with our responsive platform. Full desktop features available on your phone or tablet.",
    color: "text-cyan-500"
  },
  {
    icon: Clock,
    title: "24/7 Trading",
    description: "Crypto markets never sleep, and neither do we. Trade Bitcoin and altcoins around the clock, every day of the year.",
    color: "text-orange-500"
  },
  {
    icon: TrendingUp,
    title: "Real-Time Data",
    description: "Live market data from multiple exchanges. Get the most accurate prices with our aggregated order book data.",
    color: "text-pink-500"
  },
  {
    icon: Users,
    title: "Expert Support",
    description: "Our UK-based support team is here to help. Get answers to your questions within minutes, not hours.",
    color: "text-indigo-500"
  },
  {
    icon: Globe,
    title: "GBP Native",
    description: "Deposit and withdraw in British Pounds via bank transfer. No currency conversion fees or international charges.",
    color: "text-emerald-500"
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
}

export function FeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="text-primary">BitCurrent</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to trade cryptocurrency with confidence
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Card className="relative h-full p-6 border-border/50 hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-300" />
                  
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${feature.color.split('-')[1]}-500/20 to-${feature.color.split('-')[1]}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { label: "Active Users", value: "10,000+", color: "text-blue-500" },
            { label: "Daily Volume", value: "£5M+", color: "text-green-500" },
            { label: "Assets Listed", value: "50+", color: "text-purple-500" },
            { label: "Uptime", value: "99.9%", color: "text-orange-500" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

