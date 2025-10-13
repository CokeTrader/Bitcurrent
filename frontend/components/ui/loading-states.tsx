"use client"

import { Loader2 } from "lucide-react"
import { Card } from "./card"

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizes = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  }
  
  return (
    <Loader2 className={`${sizes[size]} animate-spin text-primary`} />
  )
}

export function LoadingCard() {
  return (
    <Card className="p-8 text-center">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground mt-4">Loading...</p>
    </Card>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-xl font-semibold mt-4">Loading BitCurrent</p>
        <p className="text-muted-foreground mt-2">Please wait...</p>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-4" />
      <div className="h-8 bg-muted rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted rounded w-full" />
    </Card>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-12 bg-muted rounded flex-1" />
          <div className="h-12 bg-muted rounded w-24" />
          <div className="h-12 bg-muted rounded w-32" />
        </div>
      ))}
    </div>
  )
}


