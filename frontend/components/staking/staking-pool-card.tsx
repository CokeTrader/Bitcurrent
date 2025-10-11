"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AssetIcon } from "@/components/ui/asset-icon"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StakingPool {
  asset: string
  name: string
  apy: number
  minStake: number
  totalStaked: number
  flexible: boolean
  lockPeriod?: number // days
  rewards: string
}

export interface StakingPoolCardProps {
  pool: StakingPool
  userBalance?: number
  onStake?: () => void
  className?: string
}

export function StakingPoolCard({
  pool,
  userBalance = 0,
  onStake,
  className
}: StakingPoolCardProps) {
  const canStake = userBalance >= pool.minStake

  return (
    <Card className={cn("p-6 card-hover", className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <AssetIcon symbol={pool.asset} size="lg" />
          <div>
            <h3 className="font-semibold text-lg">{pool.name}</h3>
            <p className="text-sm text-muted-foreground">{pool.asset} Staking</p>
          </div>
        </div>
        {pool.flexible ? (
          <Badge variant="outline" className="gap-1">
            <Unlock className="h-3 w-3" />
            Flexible
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            {pool.lockPeriod}d Locked
          </Badge>
        )}
      </div>

      {/* APY - Most Important */}
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-success font-mono">
            {pool.apy.toFixed(1)}%
          </span>
          <span className="text-sm text-muted-foreground">APY</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Annual Percentage Yield
        </p>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Minimum Stake</span>
          <span className="font-mono font-medium">
            {pool.minStake} {pool.asset}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Staked</span>
          <span className="font-mono font-medium">
            {pool.totalStaked.toLocaleString()} {pool.asset}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Rewards</span>
          <span className="font-medium">{pool.rewards}</span>
        </div>
        {userBalance > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your Balance</span>
            <span className="font-mono font-medium">
              {userBalance.toFixed(4)} {pool.asset}
            </span>
          </div>
        )}
      </div>

      {/* Calculator */}
      {canStake && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Estimated Annual Earnings</p>
          <p className="font-mono font-semibold text-lg text-success">
            +{(userBalance * (pool.apy / 100)).toFixed(4)} {pool.asset}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ≈ £{((userBalance * (pool.apy / 100)) * 42185).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={onStake}
        disabled={!canStake}
        className="w-full"
        size="lg"
      >
        <TrendingUp className="h-4 w-4" />
        {canStake ? `Stake ${pool.asset}` : `Insufficient ${pool.asset} Balance`}
      </Button>

      {!canStake && userBalance > 0 && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Need {(pool.minStake - userBalance).toFixed(4)} {pool.asset} more to stake
        </p>
      )}
    </Card>
  )
}







