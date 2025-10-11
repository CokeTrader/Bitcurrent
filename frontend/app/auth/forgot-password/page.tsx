"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Mail, ArrowLeft, CheckCircle2, Info } from "lucide-react"
import { forgotPasswordSchema } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const email = watch("email")

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success("Reset link sent!", {
        description: "Check your email for password reset instructions"
      })
      
      setSubmitted(true)
    } catch (error) {
      toast.error("Failed to send reset link")
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/10 animate-gradient" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-success" />
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-3 font-display">Check Your Email</h2>
          <p className="text-muted-foreground mb-2">
            We've sent password reset instructions to
          </p>
          <p className="text-foreground font-semibold mb-6">{email}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
          
          <Link href="/auth/login">
            <Button variant="outline" className="w-full" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your email and we'll send you instructions"
      showBackLink
      backLinkText="Back to login"
      backLinkHref="/auth/login"
      showTrustBadges={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className={cn(
                "pl-10 h-12 bg-background/50",
                errors.email && "border-danger"
              )}
              {...register("email")}
              autoFocus
            />
          </div>
          {errors.email && (
            <p className="text-xs text-danger">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12"
          disabled={isSubmitting || !email}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            "Send Reset Instructions"
          )}
        </Button>

        {/* Security note */}
        <div className="p-4 rounded-lg bg-info/5 border border-info/20">
          <div className="flex gap-3">
            <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Security Note:</strong> For your protection, we'll only send the reset link
              if this email is registered with BitCurrent.
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}

