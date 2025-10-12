"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Zap, Users, Target, Award, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const stats = [
    { label: "Trading Volume", value: "£2.5M+", icon: TrendingUp },
    { label: "Active Users", value: "500+", icon: Users },
    { label: "Trades Executed", value: "10,000+", icon: Zap },
    { label: "Uptime", value: "99.9%", icon: Shield }
  ]

  const values = [
    {
      icon: Shield,
      title: "Security First",
      description: "95% cold storage, 2FA, bank-grade encryption. Your funds are protected by industry-leading security measures."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Sub-second execution on all trades. Our infrastructure is built for speed and reliability."
    },
    {
      icon: Users,
      title: "Customer Focused",
      description: "24/7 support, transparent fees, and a platform designed for both beginners and pros."
    },
    {
      icon: Target,
      title: "Fair Pricing",
      description: "0.25% trading fees - 6x cheaper than competitors. We believe in fair, transparent pricing."
    }
  ]

  const team = [
    {
      name: "Alex Thompson",
      role: "CEO & Founder",
      bio: "Former Goldman Sachs trader with 15 years in fintech"
    },
    {
      name: "Sarah Chen",
      role: "CTO",
      bio: "Ex-Google engineer, built trading systems at scale"
    },
    {
      name: "James Wilson",
      role: "Head of Compliance",
      bio: "10 years FCA experience, crypto regulation expert"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">
              About BitCurrent
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The UK's most affordable crypto trading platform. Built for traders who value transparency, security, and fair pricing.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Mission */}
          <Card className="p-8 mb-16 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <h2 className="text-3xl font-bold mb-4 text-center">Our Mission</h2>
            <p className="text-lg text-center max-w-3xl mx-auto">
              To make cryptocurrency trading accessible, affordable, and secure for everyone in the UK. 
              We believe that high fees and complex interfaces shouldn't stand between people and financial freedom.
            </p>
          </Card>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, idx) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-6">
                    <value.icon className="h-10 w-10 text-primary mb-4" />
                    <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Story */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <Card className="p-8">
              <div className="space-y-4 text-lg">
                <p>
                  BitCurrent was founded in 2024 with a simple observation: UK crypto traders were getting ripped off. 
                  Platforms like Coinbase were charging 1.5% fees while offering minimal innovation.
                </p>
                <p>
                  We built BitCurrent to fix this. By leveraging modern technology and institutional-grade infrastructure, 
                  we're able to offer fees as low as 0.25% - 6x cheaper than the competition.
                </p>
                <p>
                  Today, we serve over 500 traders across the UK, processing millions in trading volume every month. 
                  And we're just getting started.
                </p>
              </div>
            </Card>
          </div>

          {/* Team */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Team</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {team.map((member, idx) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-green-600 mx-auto mb-4" />
                    <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                    <div className="text-sm text-primary mb-2">{member.role}</div>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card className="p-8 text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <h2 className="text-3xl font-bold mb-4">Join the Revolution</h2>
            <p className="text-lg mb-6 opacity-90">
              Trade crypto the way it should be: fast, secure, and affordable
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="font-bold">
                Get £10 Free - Start Trading →
              </Button>
            </Link>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
