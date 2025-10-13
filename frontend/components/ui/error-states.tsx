"use client"

import { Card } from "./card"
import { Button } from "./button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export function ErrorCard({ message, onRetry }: { message?: string, onRetry?: () => void }) {
  return (
    <Card className="p-8 text-center border-red-200 dark:border-red-800">
      <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
      <h3 className="text-lg font-bold mb-2">Something went wrong</h3>
      <p className="text-muted-foreground mb-6">
        {message || "An error occurred. Please try again."}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </Card>
  )
}

export function Error404() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg">
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="p-8 text-center border-orange-200 dark:border-orange-800">
      <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
      <h3 className="text-lg font-bold mb-2">Connection Error</h3>
      <p className="text-muted-foreground mb-6">
        Unable to connect to BitCurrent servers. Check your internet connection.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      )}
    </Card>
  )
}

export function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="p-12 text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Scheduled Maintenance</h2>
        <p className="text-muted-foreground mb-6">
          BitCurrent is currently undergoing scheduled maintenance. 
          We'll be back shortly.
        </p>
        <p className="text-sm text-muted-foreground">
          Estimated downtime: 10-15 minutes
        </p>
      </Card>
    </div>
  )
}


