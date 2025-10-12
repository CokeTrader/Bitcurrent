"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Users, Gift } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function ReferralProgram({ userId }: { userId?: string }) {
  const [copied, setCopied] = useState(false)
  const referralCode = userId ? `BC${userId.slice(0, 8).toUpperCase()}` : "BCXXXXXXXX"
  const referralLink = `https://bitcurrent.vercel.app/auth/register?ref=${referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success("Referral link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <Gift className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Earn £10 for Every Friend!</h3>
          <p className="text-sm text-muted-foreground">They get £10, you get £10. Win-win!</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* How it Works */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mx-auto mb-2">
              1
            </div>
            <p className="text-sm font-semibold">Share Your Link</p>
            <p className="text-xs text-muted-foreground">Send to friends via email or social media</p>
          </div>
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mx-auto mb-2">
              2
            </div>
            <p className="text-sm font-semibold">They Sign Up</p>
            <p className="text-xs text-muted-foreground">Friend creates account & completes KYC</p>
          </div>
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center mx-auto mb-2">
              3
            </div>
            <p className="text-sm font-semibold">You Both Earn £10</p>
            <p className="text-xs text-muted-foreground">Instant credit to both accounts</p>
          </div>
        </div>

        {/* Referral Link */}
        <div>
          <label className="text-sm font-medium mb-2 block">Your Referral Link</label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Referrals</span>
            </div>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Friends joined</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-xs">Earnings</span>
            </div>
            <div className="text-2xl font-bold">£0</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-muted-foreground">
          * Friend must complete KYC verification. Bonus credited within 24 hours. Unlimited referrals. No expiry.
        </p>
      </div>
    </Card>
  )
}

