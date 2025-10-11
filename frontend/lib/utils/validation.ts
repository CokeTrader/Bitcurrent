import { z } from "zod"

// Email validation schema
export const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address")
})

// Password validation schema
export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character")
})

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
})

// Signup validation schema
export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions"
  })
})

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
})

// Reset password schema
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

// Password strength calculator
export interface PasswordStrength {
  score: number // 0-100
  label: 'weak' | 'medium' | 'strong'
  color: string
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0
  
  if (password.length >= 8) score += 25
  if (password.length >= 12) score += 25
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20
  if (/[0-9]/.test(password)) score += 15
  if (/[^A-Za-z0-9]/.test(password)) score += 15
  
  let label: 'weak' | 'medium' | 'strong' = 'weak'
  if (score >= 60) label = 'medium'
  if (score >= 80) label = 'strong'
  
  const colors = {
    weak: '#FF3B69',
    medium: '#FFB020',
    strong: '#00D395'
  }
  
  return { score, label, color: colors[label] }
}

// Password validation requirements checker
export interface PasswordRequirement {
  label: string
  met: boolean
}

export function checkPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) }
  ]
}

// Mock API calls
export async function mockSignup(email: string, password: string) {
  await new Promise(resolve => setTimeout(resolve, 1500))
  return { success: true, userId: 'mock-user-id' }
}

export async function mockLogin(email: string, password: string) {
  await new Promise(resolve => setTimeout(resolve, 1200))
  if (email === 'demo@bitcurrent.co.uk' && password === 'Demo123!') {
    return { success: true, token: 'mock-jwt-token' }
  }
  throw new Error('Invalid credentials')
}

export async function mockForgotPassword(email: string) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { success: true }
}








