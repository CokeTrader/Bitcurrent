"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Check, Eye, EyeOff, Mail, Lock, Phone } from "lucide-react"
import { Header } from "@/components/layout/header"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  
  // Form state
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [agreedToTerms, setAgreedToTerms] = React.useState(false)
  
  // Validation state
  const [emailValid, setEmailValid] = React.useState<boolean | undefined>()
  const [emailError, setEmailError] = React.useState("")
  const [passwordError, setPasswordError] = React.useState("")
  const [phoneError, setPhoneError] = React.useState("")
  const [submitError, setSubmitError] = React.useState("")

  // Real-time email validation
  React.useEffect(() => {
    if (!email) {
      setEmailValid(undefined)
      setEmailError("")
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email)
    setEmailValid(isValid)
    setEmailError(isValid ? "" : "Please enter a valid email address")
  }, [email])

  // Password strength calculation
  const getPasswordStrength = (pwd: string): number => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
  const strengthColors = ["bg-sell", "bg-sell/70", "bg-warning", "bg-buy/70", "bg-buy"]

  // Real-time password validation
  React.useEffect(() => {
    if (!password) {
      setPasswordError("")
      return
    }

    const errors = []
    if (password.length < 12) errors.push("at least 12 characters")
    if (!/[A-Z]/.test(password)) errors.push("1 uppercase letter")
    if (!/[0-9]/.test(password)) errors.push("1 number")
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push("1 special character")
    
    if (errors.length > 0) {
      setPasswordError(`Password must contain ${errors.join(", ")}`)
    } else {
      setPasswordError("")
    }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    
    if (step < 3) {
      setStep(step + 1)
      return
    }

    setLoading(true)
    
    try {
      const { apiClient } = await import("@/lib/api/client")
      const response = await apiClient.register(email, password, "User", "Account")
      
      // Successfully registered - redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Registration failed:", error)
      
      // Show user-friendly error message
      let errorMessage = "Registration failed. Please try again."
      
      if (error.response) {
        const status = error.response.status
        const data = error.response.data
        
        if (status === 409) {
          errorMessage = "This email is already registered. Please sign in instead."
        } else if (status === 400) {
          errorMessage = data.message || "Invalid registration data. Please check your inputs."
        } else if (status === 500) {
          errorMessage = "Server error. Please try again in a moment."
        } else if (data && data.message) {
          errorMessage = data.message
        }
      } else if (error.request) {
        errorMessage = "Cannot connect to server. Please check your internet connection."
      }
      
      setSubmitError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              Get started with BitCurrent in under 2 minutes
            </CardDescription>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 pt-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step
                      ? "w-8 bg-primary"
                      : s < step
                      ? "w-6 bg-buy"
                      : "w-6 bg-muted"
                  }`}
                  role="progressbar"
                  aria-label={`Step ${s} of 3`}
                  aria-valuenow={s}
                  aria-valuemin={1}
                  aria-valuemax={3}
                />
              ))}
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Error Message */}
              {submitError && (
                <div
                  className="bg-sell/10 border border-sell/20 text-sell px-4 py-3 rounded-md text-sm flex items-start gap-2"
                  role="alert"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <div>
                    <strong>Registration Error:</strong>
                    <p>{submitError}</p>
                    {submitError.includes("already registered") && (
                      <p className="mt-2">
                        <Link href="/auth/login" className="underline font-medium">
                          Click here to sign in instead
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Email */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={emailError}
                        success={emailValid}
                        autoComplete="email"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Password */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={passwordError}
                        autoComplete="new-password"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strength: <span className="font-medium">{strengthLabels[passwordStrength - 1] || "Very Weak"}</span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : undefined}
                      success={!!confirmPassword && password === confirmPassword}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Phone & Terms */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+44 7XXX XXXXXX"
                        className="pl-10"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      For account recovery and 2FA via SMS
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-input"
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
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

                  {/* Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium">Account Summary:</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-buy" />
                        Email: {email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-buy" />
                        Password: {password.length} characters
                      </div>
                      {phone && (
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-buy" />
                          Phone: {phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={
                  (step === 1 && (!emailValid || !email)) ||
                  (step === 2 && (!!passwordError || !confirmPassword || password !== confirmPassword)) ||
                  (step === 3 && !agreedToTerms) ||
                  loading
                }
                loading={loading}
              >
                {step < 3 ? (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  className="w-full"
                >
                  Back
                </Button>
              )}

              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}
