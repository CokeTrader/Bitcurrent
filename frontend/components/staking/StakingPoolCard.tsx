"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AssetIcon } from "@/components/ui/asset-icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  TrendingUp, 
  Lock, 
  Clock,
  Zap,
  Info,
  ArrowRight
} from "lucide-react"
import { StakingPool, calculateProjectedEarnings } from "@/lib/web3/contracts"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface StakingPoolCardProps {
  pool: StakingPool
  userStaked?: number
  userRewards?: number
  onStake?: (amount: number) => void
  onUnstake?: (amount: number) => void
  onClaim?: () => void
  className?: string
}

export function StakingPoolCard({
  pool,
  userStaked = 0,
  userRewards = 0,
  onStake,
  onUnstake,
  onClaim,
  className
}: StakingPoolCardProps) {
  const [tab, setTab] = React.useState<'stake' | 'unstake'>('stake')
  const [amount, setAmount] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const amountNum = parseFloat(amount) || 0
  const projectedEarnings = calculateProjectedEarnings(amountNum, pool.apy, 365)

  const handleAction = async () => {
    if (!amount || amountNum <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (tab === 'stake' && amountNum < pool.minStake) {
      toast.error(`Minimum stake is ${pool.minStake} ${pool.symbol}`)
      return
    }

    if (tab === 'unstake' && amountNum > userStaked) {
      toast.error("Insufficient staked balance")
      return
    }

    setIsLoading(true)
    try {
      if (tab === 'stake') {
        await onStake?.(amountNum)
        toast.success(`Successfully staked ${amountNum} ${pool.symbol}`)
      } else {
        await onUnstake?.(amountNum)
        toast.success(`Successfully unstaked ${amountNum} ${pool.symbol}`)
      }
      setAmount('')
    } catch (error: any) {
      toast.error(error.message || "Transaction failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async () => {
    if (userRewards <= 0) {
      toast.error("No rewards to claim")
      return
    }

    setIsLoading(true)
    try {
      await onClaim?.()
      toast.success(`Successfully claimed ${userRewards.toFixed(4)} ${pool.symbol}`)
    } catch (error: any) {
      toast.error(error.message || "Claim failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Pool Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AssetIcon symbol={pool.symbol} size="lg" />
            <div>
              <h3 className="text-lg font-bold font-display">{pool.name}</h3>
              <p className="text-sm text-muted-foreground">{pool.asset}</p>
            </div>
          </div>
          {pool.autoCompound && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <Zap className="h-3 w-3 mr-1" />
              Auto-Compound
            </Badge>
          )}
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              APY
            </div>
            <p className="text-xl font-bold text-primary">{pool.apy}%</p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">TVL</p>
            <p className="text-lg font-bold">
              £{(pool.tvl / 1000000).toFixed(1)}M
            </p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Lock className="h-3 w-3" />
              Lock
            </div>
            <p className="text-lg font-bold">
              {pool.lockPeriod === 0 ? 'Flexible' : `${pool.lockPeriod}d`}
            </p>
          </div>
        </div>

        {/* User Position */}
        {userStaked > 0 && (
          <div className="p-4 bg-success/5 rounded-lg border border-success/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Stake</p>
                <p className="text-lg font-bold font-mono">
                  {userStaked.toFixed(4)} {pool.symbol}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending Rewards</p>
                <p className="text-lg font-bold font-mono text-success">
                  +{userRewards.toFixed(4)} {pool.symbol}
                </p>
              </div>
            </div>
            {userRewards > 0 && (
              <Button
                onClick={handleClaim}
                disabled={isLoading}
                className="w-full mt-4"
                size="sm"
              >
                Claim Rewards
              </Button>
            )}
          </div>
        )}

        {/* Stake/Unstake Tabs */}
        <div>
          <div className="flex gap-2 mb-4">
            <Button
              variant={tab === 'stake' ? 'default' : 'outline'}
              onClick={() => setTab('stake')}
              className="flex-1"
            >
              Stake
            </Button>
            <Button
              variant={tab === 'unstake' ? 'default' : 'outline'}
              onClick={() => setTab('unstake')}
              className="flex-1"
              disabled={userStaked <= 0}
            >
              Unstake
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor={`amount-${pool.id}`}>
                Amount ({pool.symbol})
              </Label>
              <Input
                id={`amount-${pool.id}`}
                type="number"
                placeholder={`Min: ${pool.minStake}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {tab === 'stake' 
                  ? `Minimum: ${pool.minStake} ${pool.symbol}` 
                  : `Available: ${userStaked.toFixed(4)} ${pool.symbol}`
                }
              </p>
            </div>

            {/* Projected Earnings */}
            {tab === 'stake' && amountNum >= pool.minStake && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-info/5 rounded-lg border border-info/10"
              >
                <div className="flex items-start gap-2 mb-3">
                  <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Projected Earnings</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Daily:</span>{' '}
                        <span className="font-mono font-semibold">
                          {projectedEarnings.daily.toFixed(4)} {pool.symbol}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Weekly:</span>{' '}
                        <span className="font-mono font-semibold">
                          {projectedEarnings.weekly.toFixed(4)} {pool.symbol}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Monthly:</span>{' '}
                        <span className="font-mono font-semibold">
                          {projectedEarnings.monthly.toFixed(4)} {pool.symbol}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Yearly:</span>{' '}
                        <span className="font-mono font-semibold text-success">
                          {projectedEarnings.yearly.toFixed(4)} {pool.symbol}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <Button
              onClick={handleAction}
              disabled={isLoading || !amount || amountNum <= 0}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {tab === 'stake' ? 'Staking...' : 'Unstaking...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {tab === 'stake' ? 'Stake' : 'Unstake'} {pool.symbol}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}









