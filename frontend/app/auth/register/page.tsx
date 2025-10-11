"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Progress } from "@/components/ui/progress"
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Check,
  X,
  CheckCircle2,
  ArrowLeft
} from "lucide-react"
import { 
  signupSchema, 
  calculatePasswordStrength, 
  checkPasswordRequirements 
} from "@/lib/utils/validation"
import { cn } from "@/lib/utils"

type SignupFormData = z.infer<typeof signupSchema>

const steps = [
  { id: 1, name: 'Email', description: 'Enter your email' },
  { id: 2, name: 'Password', description: 'Secure your account' },
  { id: 3, name: 'Verify', description: 'Check your inbox' }
]

export default function RegisterPagePremium() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [showPassword, setShowPassword] = React.useState(false)
  const [emailSubmitted, setEmailSubmitted] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange"
  })

  const email = watch("email")
  const password = watch("password")
  const acceptTerms = watch("acceptTerms")

  const passwordStrength = password ? calculatePasswordStrength(password) : null
  const passwordRequirements = password ? checkPasswordRequirements(password) : []

  const handleNextStep = async () => {
    let isValid = false
    
    if (currentStep === 1) {
      isValid = await trigger("email")
      if (isValid) {
        setEmailSubmitted(true)
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      isValid = await trigger(["password", "acceptTerms"])
      if (isValid) {
        setCurrentStep(3)
      }
    }
  }

  const onSubmit = async (data: SignupFormData) => {
    try {
      const { apiClient } = await import("@/lib/api/client")
      const response = await apiClient.register(data.email, data.password, "User", "Account")
      
      // Set session cookie for middleware authentication
      if (response.token && typeof window !== 'undefined') {
        document.cookie = `session_token=${response.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      }
      
      toast.success("Account created!", {
        description: "Check your email to verify your account"
      })
      
      // Move to verification step
      setCurrentStep(3)
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message || "Please try again"
      })
    }
  }

  const progress = (currentStep / 3) * 100

  // Step 3 - Email Verification
  if (currentStep === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-success/5 animate-gradient" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-12 w-12 text-success" />
          </motion.div>
          
          <h2 className="text-3xl font-bold mb-3 font-display">Check your email</h2>
          <p className="text-muted-foreground mb-2">
            We've sent a verification link to
          </p>
          <p className="text-foreground font-semibold mb-6">{email}</p>
          
          <p className="text-sm text-muted-foreground mb-8">
            Click the link in the email to verify your account and start trading.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard")}
              size="lg"
              className="w-full"
            >
              Go to Dashboard
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              onClick={() => toast.success("Verification email resent!")}
            >
              Didn't receive the email? Resend
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join 500,000+ traders on BitCurrent"
      showBackLink={currentStep > 1}
      backLinkText="Back"
      backLinkHref="#"
    >
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all",
                currentStep >= step.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 w-12 mx-2 transition-all",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1 - Email */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
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
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-danger">{errors.email.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2 - Password */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Email display */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{email}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="h-auto p-1"
                >
                  Edit
                </Button>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Create Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className={cn(
                      "pl-10 pr-10 h-12 bg-background/50",
                      errors.password && "border-danger"
                    )}
                    {...register("password")}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength meter */}
              {passwordStrength && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength</span>
                    <span 
                      className="font-semibold capitalize"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength.score}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: passwordStrength.color }}
                    />
                  </div>
                </div>
              )}

              {/* Requirements checklist */}
              {password && (
                <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Password requirements:
                  </p>
                  {passwordRequirements.map((req, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 text-xs"
                    >
                      {req.met ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={req.met ? "text-success" : "text-muted-foreground"}>
                        {req.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Terms */}
              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  {...register("acceptTerms")}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                  I agree to BitCurrent's{" "}
                  <Link href="/legal/terms" target="_blank" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/privacy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-xs text-danger">{errors.acceptTerms.message}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="space-y-3 pt-4">
          {currentStep < 2 ? (
            <Button
              type="button"
              size="lg"
              className="w-full h-12"
              onClick={handleNextStep}
              disabled={!email || !!errors.email}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              className="w-full h-12"
              disabled={isSubmitting || !acceptTerms}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          )}

          {currentStep > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {/* Sign in link */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}

