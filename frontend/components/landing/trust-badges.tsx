"use client"

import { Shield, Lock, Award, Check } from "lucide-react"

export function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: "UK Crypto Broker",
      description: "Registered and compliant"
    },
    {
      icon: Lock,
      title: "95% Cold Storage",
      description: "Bank-grade security"
    },
    {
      icon: Award,
      title: "£85k Protected",
      description: "Funds insurance"
    },
    {
      icon: Check,
      title: "FCA Compliant",
      description: "AML/KYC verified"
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
      {badges.map((badge, idx) => (
        <div key={idx} className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-950 mb-3">
            <badge.icon className="h-8 w-8 text-green-600" />
          </div>
          <h4 className="font-bold mb-1">{badge.title}</h4>
          <p className="text-sm text-muted-foreground">{badge.description}</p>
        </div>
      ))}
    </div>
  )
}


