"use client"

import { TrendingUp, Users, Shield, Zap } from "lucide-react"

export function HeroStats() {
  const stats = [
    { icon: TrendingUp, label: "£2.5M+", sublabel: "Trading Volume" },
    { icon: Users, label: "500+", sublabel: "Active Traders" },
    { icon: Shield, label: "99.9%", sublabel: "Uptime" },
    { icon: Zap, label: "<1s", sublabel: "Avg. Execution" }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
            <stat.icon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1">{stat.label}</div>
          <div className="text-sm text-muted-foreground">{stat.sublabel}</div>
        </div>
      ))}
    </div>
  )
}

