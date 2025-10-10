"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, Fingerprint } from "lucide-react"
import { Header } from "@/components/layout/header"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [biometricLoading, setBiometricLoading] = React.useState(false)
  
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      const { apiClient } = await import("@/lib/api/client")
      const response = await apiClient.login(email, password)
      
      // Store user info if needed
      if (typeof window !== 'undefined' && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user))
      }
      
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      
      let errorMessage = "Invalid email or password. Please try again."
      
      if (err.response) {
        const status = err.response.status
        const data = err.response.data
        
        if (status === 401) {
          errorMessage = "Invalid email or password."
        } else if (status === 404) {
          errorMessage = "Account not found. Would you like to register?"
        } else if (status === 403) {
          errorMessage = "Your account has been suspended. Please contact support."
        } else if (status === 500) {
          errorMessage = "Server error. Please try again in a moment."
        } else if (data && data.message) {
          errorMessage = data.message
        }
      } else if (err.request) {
        errorMessage = "Cannot connect to server. Please check your internet connection."
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricLogin = async () => {
    setBiometricLoading(true)
    
    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        setError("Biometric authentication not available on this device")
        return
      }

      // TODO: Implement WebAuthn authentication
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push("/dashboard")
    } catch (err) {
      setError("Biometric authentication failed. Please use password.")
    } finally {
      setBiometricLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your BitCurrent account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {/* Error Message */}
              {error && (
                <div
                  className="bg-sell/10 border border-sell/20 text-sell px-4 py-3 rounded-md text-sm"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
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
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:underline"
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
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
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

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground">
                  Remember me for 30 days
                </label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={!email || !password || loading}
              >
                Sign In
              </Button>

              <div className="relative w-full">
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
                className="w-full"
                onClick={handleBiometricLogin}
                loading={biometricLoading}
                disabled={biometricLoading}
              >
                <Fingerprint className="mr-2 h-5 w-5" />
                Sign in with Biometrics
              </Button>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-primary hover:underline font-medium">
                  Create account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}
