"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Lock, Calendar, Award } from "lucide-react"
import Link from "next/link"

export default function EarnPage() {
  const stakingOptions = [
    {
      symbol: "ETH",
      name: "Ethereum",
      apy: "4.5%",
      minAmount: "0.01 ETH",
      lockPeriod: "Flexible",
      risk: "Low",
      description: "Earn rewards by staking Ethereum. Withdraw anytime with no lock-up period."
    },
    {
      symbol: "SOL",
      name: "Solana",
      apy: "6.8%",
      minAmount: "1 SOL",
      lockPeriod: "Flexible",
      risk: "Medium",
      description: "High APY staking on Solana. Flexible withdrawal with epoch-based rewards."
    },
    {
      symbol: "ADA",
      name: "Cardano",
      apy: "5.2%",
      minAmount: "10 ADA",
      lockPeriod: "Flexible",
      risk: "Low",
      description: "Stake Cardano and earn passive income. No minimum lock period required."
    },
    {
      symbol: "DOT",
      name: "Polkadot",
      apy: "12.5%",
      minAmount: "1 DOT",
      lockPeriod: "28 days",
      risk: "Medium",
      description: "High yield staking with 28-day unbonding period. Great for long-term holders."
    }
  ]

  const learningOptions = [
    {
      title: "Bitcoin Basics",
      reward: "£5",
      duration: "10 mins",
      lessons: 5,
      description: "Learn what Bitcoin is and how it works"
    },
    {
      title: "Ethereum & Smart Contracts",
      reward: "£5",
      duration: "15 mins",
      lessons: 6,
      description: "Understanding Ethereum and DeFi ecosystem"
    },
    {
      title: "Trading Strategies",
      reward: "£10",
      duration: "20 mins",
      lessons: 8,
      description: "Learn technical analysis and risk management"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              Earn Passive Income
            </h1>
            <p className="text-xl text-muted-foreground">
              Stake your crypto and earn rewards, or learn and earn free crypto
            </p>
          </div>

          {/* Staking Section */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Staking Rewards</h2>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Up to 12.5% APY
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {stakingOptions.map((option, idx) => (
                <motion.div
                  key={option.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-6 hover:border-primary transition">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-green-600" />
                        <div>
                          <h3 className="font-bold text-lg">{option.name}</h3>
                          <p className="text-sm text-muted-foreground">{option.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{option.apy}</div>
                        <p className="text-xs text-muted-foreground">APY</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">{option.description}</p>

                    <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                      <div>
                        <div className="text-muted-foreground mb-1">Minimum</div>
                        <div className="font-semibold">{option.minAmount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Lock Period</div>
                        <div className="font-semibold">{option.lockPeriod}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Risk</div>
                        <Badge variant={option.risk === "Low" ? "default" : "secondary"} className="text-xs">
                          {option.risk}
                        </Badge>
                      </div>
                    </div>

                    <Button className="w-full">
                      Start Staking {option.symbol}
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Learn & Earn Section */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Learn & Earn</h2>
              <Badge variant="outline" className="text-purple-600 border-purple-600">
                Earn up to £20
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {learningOptions.map((option, idx) => (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Award className="h-10 w-10 text-purple-600" />
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">{option.reward}</div>
                        <p className="text-xs text-muted-foreground">Reward</p>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg mb-2">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{option.description}</p>

                    <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {option.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {option.lessons} lessons
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      Start Learning →
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* How Staking Works */}
          <Card className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <h3 className="text-2xl font-bold mb-6 text-center">How Staking Works</h3>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                  1
                </div>
                <h4 className="font-semibold mb-2">Choose Asset</h4>
                <p className="text-sm text-muted-foreground">Select which crypto to stake</p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                  2
                </div>
                <h4 className="font-semibold mb-2">Lock Amount</h4>
                <p className="text-sm text-muted-foreground">Stake your chosen amount</p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                  3
                </div>
                <h4 className="font-semibold mb-2">Earn Rewards</h4>
                <p className="text-sm text-muted-foreground">Receive daily staking rewards</p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                  4
                </div>
                <h4 className="font-semibold mb-2">Withdraw Anytime</h4>
                <p className="text-sm text-muted-foreground">Unstake when you want</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

