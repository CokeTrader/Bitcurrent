"use client"

import { useEffect } from "react"
import { ErrorCard } from "@/components/ui/error-states"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <ErrorCard 
          message={error.message || "An unexpected error occurred"}
          onRetry={reset}
        />
      </div>
    </div>
  )
}


