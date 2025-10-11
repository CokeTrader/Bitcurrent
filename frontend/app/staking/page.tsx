"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useAccount } from 'wagmi'
import { WalletConnect } from "@/components/web3/WalletConnect"
import { StakingPoolCard } from "@/components/staking/StakingPoolCard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  STAKING_POOLS,
  getStakedAmount,
  getPendingRewards,
  getTotalStakedValue
} from "@/lib/web3/contracts"
import { 
  TrendingUp,
  Wallet,
  DollarSign,
  Award,
  Sparkles,
  Shield,
  Zap
} from "lucide-react"
import { toast } from "sonner"

export default function StakingPageEnhanced() {
  const { address, isConnected } = useAccount()
  const [totalStaked, setTotalStaked] = React.useState(0)
  const [totalRewards, setTotalRewards] = React.useState(0)
  const [userStakes, setUserStakes] = React.useState<Record<string, number>>({})
  const [userRewards, setUserRewards] = React.useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = React.useState(false)

  // Load user staking data
  React.useEffect(() => {
    if (address) {
      loadUserData()
    }
  }, [address])

  const loadUserData = async () => {
    if (!address) return
    
    setIsLoading(true)
    try {
      // Load staked amounts and rewards for each pool
      const stakes: Record<string, number> = {}
      const rewards: Record<string, number> = {}
      
      for (const pool of STAKING_POOLS) {
        stakes[pool.id] = await getStakedAmount(pool.id, address)
        rewards[pool.id] = await getPendingRewards(pool.id, address)
      }
      
      setUserStakes(stakes)
      setUserRewards(rewards)
      
      // Get total portfolio value
      const { total, rewards: totalRewardsValue } = await getTotalStakedValue(address)
      setTotalStaked(total)
      setTotalRewards(totalRewardsValue)
    } catch (error) {
      console.error('Failed to load staking data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStake = async (poolId: string, amount: number) => {
    // In production, this would call the smart contract
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success("Stake transaction submitted")
    await loadUserData()
  }

  const handleUnstake = async (poolId: string, amount: number) => {
    // In production, this would call the smart contract
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success("Unstake transaction submitted")
    await loadUserData()
  }

  const handleClaim = async (poolId: string) => {
    // In production, this would call the smart contract
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success("Rewards claimed successfully")
    await loadUserData()
  }

  return (
    <div className="min-h-screen bg-background">
      <main id="main-content" className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Page Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold font-display">Earn with Staking</h1>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Up to 7.8% APY
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Stake your crypto assets and earn passive rewards
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Secure Staking</p>
                  <p className="text-xs text-muted-foreground">Audited smart contracts</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Auto-Compound</p>
                  <p className="text-xs text-muted-foreground">Maximize your returns</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium">Flexible</p>
                  <p className="text-xs text-muted-foreground">Unstake anytime</p>
                </div>
              </div>
            </Card>
          </div>

          {!isConnected ? (
            /* Not Connected State */
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="p-8">
                <div className="text-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Wallet className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2 font-display">Connect Your Wallet</h2>
                    <p className="text-muted-foreground">
                      Connect your wallet to start staking and earning rewards
                    </p>
                  </div>
                  <WalletConnect showBalance={false} />
                </div>
              </Card>

              {/* Info Card */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4 font-display">How Staking Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Choose a Pool</p>
                      <p className="text-sm text-muted-foreground">
                        Select from our curated staking pools
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Stake Your Assets</p>
                      <p className="text-sm text-muted-foreground">
                        Lock your tokens to earn rewards
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Earn Rewards</p>
                      <p className="text-sm text-muted-foreground">
                        Claim your rewards anytime
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            /* Connected State */
            <>
              {/* Portfolio Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <p className="text-sm">Total Staked</p>
                  </div>
                  <p className="text-3xl font-bold font-mono">
                    {totalStaked.toFixed(4)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ≈ £{(totalStaked * 2000).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Award className="h-4 w-4" />
                    <p className="text-sm">Pending Rewards</p>
                  </div>
                  <p className="text-3xl font-bold font-mono text-success">
                    +{totalRewards.toFixed(4)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ≈ £{(totalRewards * 2000).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <p className="text-sm">Average APY</p>
                  </div>
                  <p className="text-3xl font-bold text-primary">6.1%</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Across all pools
                  </p>
                </Card>
              </div>

              {/* Staking Pools */}
              <div>
                <h2 className="text-2xl font-bold mb-4 font-display">Available Pools</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {STAKING_POOLS.map((pool) => (
                    <StakingPoolCard
                      key={pool.id}
                      pool={pool}
                      userStaked={userStakes[pool.id] || 0}
                      userRewards={userRewards[pool.id] || 0}
                      onStake={(amount) => handleStake(pool.id, amount)}
                      onUnstake={(amount) => handleUnstake(pool.id, amount)}
                      onClaim={() => handleClaim(pool.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  )
}

