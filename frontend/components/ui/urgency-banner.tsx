"use client"

import { AlertCircle, Clock, TrendingUp } from "lucide-react"
import { Card } from "./card"

export function UrgencyBanner() {
  return (
    <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20 p-4 mb-6">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
        <div className="flex-1">
          <p className="font-semibold text-sm text-orange-900 dark:text-orange-200">
            Limited Beta Access - First 100 Users Get £10 Free
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300">
            67 spots remaining • Offer ends soon
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-orange-600" />
      </div>
    </Card>
  )
}


