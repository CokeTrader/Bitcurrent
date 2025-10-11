"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

export interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary mx-auto mb-4"
        />
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please wait while we load your data
        </p>
      </motion.div>
    </div>
  )
}

export function ComponentLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="h-12 w-12 skeleton rounded-full mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function InlineLoader() {
  return (
    <Loader2 className="h-4 w-4 animate-spin" />
  )
}



