"use client"

import { Card } from "@/components/ui/card"
import { UserPlus, CreditCard, TrendingUp, Gift } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      number: "1",
      title: "Sign Up Free",
      description: "Create your account in 2 minutes. Email verification only.",
      highlight: "30 seconds"
    },
    {
      icon: CreditCard,
      number: "2",
      title: "Deposit Instantly",
      description: "Add funds via Stripe. Your deposit appears immediately.",
      highlight: "Instant"
    },
    {
      icon: TrendingUp,
      number: "3",
      title: "Start Trading",
      description: "Buy Bitcoin, Ethereum, and more with just 0.25% fees.",
      highlight: "0.25% fees"
    },
    {
      icon: Gift,
      number: "4",
      title: "Earn Rewards",
      description: "Get £10 bonus, refer friends, earn staking rewards.",
      highlight: "£10 free"
    }
  ]

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How BitCurrent Works</h2>
          <p className="text-xl text-muted-foreground">
            Start trading in 4 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <Card className="p-6 text-center h-full">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                
                <step.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                
                <div className="inline-block px-3 py-1 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-semibold">
                  {step.highlight}
                </div>
              </Card>
              
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <div className="h-0.5 w-6 bg-gradient-to-r from-green-600 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

