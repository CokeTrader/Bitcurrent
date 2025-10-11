"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Eye, EyeOff, Mail, Lock, Fingerprint, ArrowRight } from "lucide-react"
import { loginSchema } from "@/lib/utils/validation"
import { cn } from "@/lib/utils"

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPagePremium() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [biometricLoading, setBiometricLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false
    }
  })

  const rememberMe = watch("rememberMe")

  const onSubmit = async (data: LoginFormData) => {
    try {
      // API call to backend
      const { apiClient } = await import("@/lib/api/client")
      const response = await apiClient.login(data.email, data.password)
      
      // Set session cookie for middleware authentication
      if (response.token && typeof window !== 'undefined') {
        document.cookie = `session_token=${response.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      }
      
      toast.success("Welcome back!", {
        description: "Successfully signed in to your account"
      })
      
      // Store user preference
      if (data.rememberMe && typeof window !== 'undefined') {
        localStorage.setItem('remember_email', data.email)
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('remember_email')
      }
      
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      
      // Show specific error message based on error type
      let errorTitle = "Sign in failed"
      let errorDescription = "Please check your credentials and try again"
      
      if (error.response) {
        // Backend returned an error response
        const status = error.response.status
        const message = error.response.data?.message || error.response.data?.error
        
        if (status === 401 || message?.includes('Invalid credentials') || message?.includes('Unauthorized')) {
          errorTitle = "Invalid credentials"
          errorDescription = "The email or password you entered is incorrect. Please try again."
        } else if (status === 404) {
          errorTitle = "Account not found"
          errorDescription = "No account exists with this email address. Please register first."
        } else if (status === 403) {
          errorTitle = "Account locked"
          errorDescription = "Your account has been locked. Please contact support."
        } else if (status >= 500) {
          errorTitle = "Server error"
          errorDescription = "Our servers are experiencing issues. Please try again later."
        } else if (message) {
          errorDescription = message
        }
      } else if (error.request) {
        // Network error - no response received
        errorTitle = "Network error"
        errorDescription = "Unable to connect to the server. Please check your internet connection."
      }
      
      toast.error(errorTitle, {
        description: errorDescription
      })
    }
  }

  const handleBiometricLogin = async () => {
    setBiometricLoading(true)
    
    try {
      if (!window.PublicKeyCredential) {
        toast.error("Biometric authentication not available on this device")
        return
      }

      // TODO: Implement WebAuthn
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push("/dashboard")
    } catch (err) {
      toast.error("Biometric authentication failed")
    } finally {
      setBiometricLoading(false)
    }
  }

  // Load remembered email
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const remembered = localStorage.getItem('remember_email')
      if (remembered) {
        setValue('email', remembered)
        setValue('rememberMe', true)
      }
    }
  }, [setValue])

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your BitCurrent account"
      showBackLink
      backLinkText="Back to home"
      backLinkHref="/"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
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
                "pl-10 h-12 bg-background/50 border-border focus:border-primary transition-all",
                errors.email && "border-danger focus:border-danger"
              )}
              {...register("email")}
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-danger mt-1 flex items-center gap-1"
              >
                {errors.email.message}
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Password Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className={cn(
                "pl-10 pr-10 h-12 bg-background/50 border-border focus:border-primary transition-all",
                errors.password && "border-danger focus:border-danger"
              )}
              {...register("password")}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-danger mt-1"
            >
              {errors.password.message}
            </motion.p>
          )}
        </motion.div>

        {/* Remember Me */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Switch
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setValue("rememberMe", checked)}
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Remember me for 30 days
            </Label>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Biometric Login */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full h-12"
            onClick={handleBiometricLogin}
            disabled={biometricLoading}
          >
            {biometricLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Sign in with Biometrics
              </span>
            )}
          </Button>
        </motion.div>

        {/* Sign up link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-4"
        >
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Create account
            </Link>
          </p>
        </motion.div>
      </form>
    </AuthLayout>
  )
}

