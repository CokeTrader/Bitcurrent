"use client"

import { AlertTriangle, X } from "lucide-react"
import { useState, useEffect } from "react"

export function RiskWarningBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the warning
    const dismissed = sessionStorage.getItem('risk-warning-dismissed')
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem('risk-warning-dismissed', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-500/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
              Risk Warning: Crypto Trading is High Risk
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              Cryptocurrency prices are extremely volatile. $1B in liquidations occurred in the last 24h.
              Only invest what you can afford to lose. 75% of retail traders lose money.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-orange-500/20 flex-shrink-0"
          >
            <X className="h-4 w-4 text-orange-600" />
          </button>
        </div>
      </div>
    </div>
  )
}


