"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface Reward {
  asset: string
  amount: number
  value: number // in GBP
  claimable: boolean
}

export interface RewardsWidgetProps {
  rewards: Reward[]
  onClaimAll?: () => void
  className?: string
}

export function RewardsWidget({ rewards, onClaimAll, className }: RewardsWidgetProps) {
  const totalValue = rewards.reduce((sum, r) => sum + r.value, 0)
  const claimableRewards = rewards.filter(r => r.claimable)
  const claimableValue = claimableRewards.reduce((sum, r) => sum + r.value, 0)

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
            <Award className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-bold">Rewards</h3>
            <p className="text-xs text-muted-foreground">Pending earnings</p>
          </div>
        </div>
        {claimableRewards.length > 0 && (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <Sparkles className="h-3 w-3 mr-1" />
            {claimableRewards.length} Ready
          </Badge>
        )}
      </div>

      {/* Total Rewards */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-1">Total Pending</p>
        <p className="text-3xl font-bold font-mono text-success">
          £{totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Rewards List */}
      <div className="space-y-2 mb-6">
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.asset}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-sm font-bold">{reward.asset[0]}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{reward.asset}</p>
                <p className="text-xs text-muted-foreground">
                  {reward.claimable ? 'Ready to claim' : 'Pending'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-semibold">
                +{reward.amount.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">
                ≈£{reward.value.toFixed(2)}
              </p>
            </div>
          </motion.div>
        ))}

        {rewards.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No pending rewards</p>
          </div>
        )}
      </div>

      {/* Claim Button */}
      {claimableRewards.length > 0 && (
        <Button
          onClick={onClaimAll}
          className="w-full"
          size="lg"
        >
          <Award className="h-4 w-4 mr-2" />
          Claim £{claimableValue.toFixed(2)}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </Card>
  )
}

