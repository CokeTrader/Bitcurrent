'use client'

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-10 w-10 text-danger" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-2">Something went wrong!</h2>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try again.
              </p>
            </div>

            <Button onClick={reset} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}








