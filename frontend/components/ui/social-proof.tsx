"use client"

import { Users, TrendingUp, DollarSign } from "lucide-react"
import { Card } from "./card"

export function SocialProof() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="p-4 text-center border-green-500/20 bg-green-500/5">
        <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
        <p className="text-2xl font-bold text-green-600">127</p>
        <p className="text-xs text-muted-foreground">Active Traders</p>
      </Card>
      
      <Card className="p-4 text-center border-blue-500/20 bg-blue-500/5">
        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
        <p className="text-2xl font-bold text-blue-600">£54,329</p>
        <p className="text-xs text-muted-foreground">24h Volume</p>
      </Card>
      
      <Card className="p-4 text-center border-purple-500/20 bg-purple-500/5">
        <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
        <p className="text-2xl font-bold text-purple-600">£0.25</p>
        <p className="text-xs text-muted-foreground">Avg Fee per Trade</p>
      </Card>
    </div>
  )
}


