"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Shield, Lock, Award, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showTrustBadges?: boolean
  showBackLink?: boolean
  backLinkText?: string
  backLinkHref?: string
  className?: string
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showTrustBadges = true,
  showBackLink = false,
  backLinkText = "Back",
  backLinkHref = "/",
  className
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-success/5 animate-gradient" />
      <motion.div
        className="absolute top-10 right-10 h-96 w-96 rounded-full bg-gradient-to-br from-primary to-success blur-3xl opacity-10"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn("relative w-full max-w-md", className)}
      >
        {/* Back link */}
        {showBackLink && (
          <Link 
            href={backLinkHref}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            ← {backLinkText}
          </Link>
        )}

        {/* Logo and title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold text-foreground mb-3 font-display tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground text-base">{subtitle}</p>
            )}
          </motion.div>
        </div>
        
        {/* Card with glassmorphism */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/80 backdrop-blur-xl border-border p-8 shadow-2xl glass">
            {children}
          </Card>
        </motion.div>
        
        {/* Trust badges */}
        {showTrustBadges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 space-y-4"
          >
            {/* Main trust indicators */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5 hover:text-success transition-colors">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>FCA Registered</span>
              </div>
              <div className="text-border">•</div>
              <div className="flex items-center gap-1.5 hover:text-success transition-colors">
                <Lock className="w-3.5 h-3.5 text-success" />
                <span>£85k Insured</span>
              </div>
              <div className="text-border">•</div>
              <div className="flex items-center gap-1.5 hover:text-success transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>95% Cold Storage</span>
              </div>
            </div>

            {/* Additional trust line */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Award className="w-3.5 h-3.5 text-warning" />
                <span>
                  Trusted by <strong className="text-foreground">500,000+</strong> traders
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}









