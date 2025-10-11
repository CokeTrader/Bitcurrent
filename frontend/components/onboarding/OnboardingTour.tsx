"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Wallet,
  TrendingUp,
  Shield,
  CreditCard
} from "lucide-react"

interface TourStep {
  title: string
  description: string
  icon: React.ReactNode
  action?: {
    label: string
    href: string
  }
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to BitCurrent!",
    description: "Let's take a quick tour to help you get started with crypto trading. This will only take a minute.",
    icon: <Sparkles className="h-12 w-12 text-primary" />
  },
  {
    title: "Complete Your Profile",
    description: "Verify your identity (KYC) to unlock higher trading limits, fiat deposits, and full platform features.",
    icon: <Shield className="h-12 w-12 text-primary" />,
    action: {
      label: "Start KYC Verification",
      href: "/kyc"
    }
  },
  {
    title: "Deposit Funds",
    description: "Add funds to your account via cryptocurrency, bank transfer, or debit/credit card to start trading.",
    icon: <CreditCard className="h-12 w-12 text-primary" />,
    action: {
      label: "Deposit Now",
      href: "/deposit"
    }
  },
  {
    title: "Start Trading",
    description: "Browse markets, place orders, and manage your portfolio. View live prices and orderbooks for all trading pairs.",
    icon: <TrendingUp className="h-12 w-12 text-primary" />,
    action: {
      label: "View Markets",
      href: "/markets"
    }
  },
  {
    title: "You're All Set!",
    description: "You're ready to start your crypto trading journey. Remember, you can always access help from the settings menu.",
    icon: <Check className="h-12 w-12 text-success" />
  }
]

interface OnboardingTourProps {
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const step = tourSteps[currentStep]
  const isLastStep = currentStep === tourSteps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleAction = () => {
    if (step.action) {
      window.location.href = step.action.href
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="w-full max-w-lg p-8 relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={onSkip}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Step Indicator */}
            <div className="flex gap-2 mb-6">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="text-center space-y-6">
              <div className="inline-flex h-24 w-24 rounded-full bg-primary/10 items-center justify-center">
                {step.icon}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{step.title}</h2>
                <p className="text-muted-foreground">{step.description}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4">
                {step.action && (
                  <Button onClick={handleAction} size="lg" className="w-full gap-2">
                    {step.action.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}

                {!isLastStep && (
                  <Button
                    onClick={handleNext}
                    variant={step.action ? "outline" : "default"}
                    size="lg"
                    className="w-full gap-2"
                  >
                    {isLastStep ? "Get Started" : "Next"}
                    {!isLastStep && <ArrowRight className="h-4 w-4" />}
                  </Button>
                )}

                {isLastStep && (
                  <Button onClick={onComplete} size="lg" className="w-full gap-2">
                    Start Trading
                    <Check className="h-4 w-4" />
                  </Button>
                )}

                {!isFirstStep && !isLastStep && (
                  <Button onClick={handleBack} variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}

                {!isLastStep && (
                  <Button onClick={onSkip} variant="ghost" size="sm">
                    Skip Tour
                  </Button>
                )}
              </div>
            </div>

            {/* Step Counter */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Step {currentStep + 1} of {tourSteps.length}
            </p>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}









