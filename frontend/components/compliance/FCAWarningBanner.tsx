"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function FCAWarningBanner() {
  const [isDismissed, setIsDismissed] = React.useState(false)
  
  // Check if user has seen warning in this session
  React.useEffect(() => {
    const dismissed = sessionStorage.getItem('fca-warning-dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('fca-warning-dismissed', 'true')
  }

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-amber-500/10 border-b border-amber-500/20 overflow-hidden"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              
              <div className="flex-1 text-sm">
                <p className="font-medium text-foreground mb-1">
                  High-Risk Investment Warning
                </p>
                <p className="text-muted-foreground">
                  Don't invest unless you're prepared to lose all the money you invest. 
                  This is a high-risk investment and you should not expect to be protected 
                  if something goes wrong.{" "}
                  <Link 
                    href="/legal/risk-disclosure" 
                    className="text-amber-500 hover:text-amber-400 underline underline-offset-2 font-medium"
                  >
                    Take 2 mins to learn more
                  </Link>
                  .
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0"
                aria-label="Dismiss warning"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function FCARegistrationNotice() {
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm space-y-2">
          <p className="font-medium text-foreground">
            FCA Registration Status
          </p>
          <p className="text-muted-foreground">
            Bitcurrent Ltd is applying for registration as a crypto asset business with the 
            Financial Conduct Authority (FCA). Registration number: <span className="font-semibold">PENDING</span>.
          </p>
          <p className="text-xs text-muted-foreground">
            This registration does not mean the FCA has approved the business model or 
            confirmed it is compliant with all financial services regulations. All trades 
            are executed through licensed third-party brokers.
          </p>
        </div>
      </div>
    </div>
  )
}

export function NonCustodialDisclaimer() {
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <p>
        <strong>Non-Custodial Service:</strong> Bitcurrent does not hold or custody your funds. 
        All trades are executed through licensed third-party brokers (Alpaca Markets LLC).
      </p>
      <p>
        <strong>No Financial Advice:</strong> This platform does not provide financial advice. 
        You should seek independent financial advice before making investment decisions.
      </p>
      <p>
        <strong>Your Responsibility:</strong> You are responsible for the security of your 
        account, the safekeeping of your crypto assets, and compliance with tax obligations.
      </p>
    </div>
  )
}

