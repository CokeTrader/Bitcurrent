"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SecurityCheck {
  id: string
  label: string
  completed: boolean
  weight: number
}

export interface SecurityScoreProps {
  checks?: SecurityCheck[]
}

// NEW accounts have NOTHING completed yet!
const defaultChecks: SecurityCheck[] = [
  { id: "email", label: "Email Verified", completed: false, weight: 15 },
  { id: "phone", label: "Phone Verified", completed: false, weight: 15 },
  { id: "2fa", label: "2FA Enabled", completed: false, weight: 25 },
  { id: "kyc", label: "ID Verified (KYC)", completed: false, weight: 20 },
  { id: "whitelist", label: "Withdrawal Whitelist Active", completed: false, weight: 15 },
  { id: "anti-phishing", label: "Anti-Phishing Code Set", completed: false, weight: 10 },
]

export function SecurityScore({ checks = defaultChecks }: SecurityScoreProps) {
  const score = checks.reduce((acc, check) => {
    return check.completed ? acc + check.weight : acc
  }, 0)

  const pendingChecks = checks.filter((check) => !check.completed)

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success"
    if (score >= 70) return "text-warning"
    return "text-danger"
  }

  const getScoreVariant = (score: number) => {
    if (score >= 90) return "success"
    if (score >= 70) return "primary"
    return "danger"
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">Your Security Score</h3>
          <p className="text-sm text-muted-foreground">
            Keep your account safe
          </p>
        </div>
        <div className={cn("text-4xl font-bold font-mono", getScoreColor(score))}>
          {score}
          <span className="text-xl text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-1000 ease-out",
              score >= 90 && "bg-success",
              score >= 70 && score < 90 && "bg-warning",
              score < 70 && "bg-danger"
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Checks list */}
      <div className="space-y-3">
        {checks.map((check) => (
          <div
            key={check.id}
            className="flex items-center gap-3 text-sm"
          >
            {check.completed ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
            <span className={cn(
              check.completed ? "text-foreground" : "text-muted-foreground"
            )}>
              {check.label}
            </span>
          </div>
        ))}
      </div>

      {/* Call to action */}
      {pendingChecks.length > 0 && (
        <Button
          variant={getScoreVariant(score) as any}
          className="w-full mt-6"
          size="lg"
        >
          <Shield className="h-4 w-4" />
          Improve Score ({pendingChecks.length} steps)
        </Button>
      )}
    </Card>
  )
}


