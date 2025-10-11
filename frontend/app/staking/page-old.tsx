"use client"

import * as React from "react"
import { StakingPoolCard } from "@/components/staking/staking-pool-card"
import { StatCard } from "@/components/ui/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AssetIcon } from "@/components/ui/asset-icon"
import { TrendingUp, Wallet, Award, Info } from "lucide-react"

// Sample staking pools
const stakingPools = [
  {
    asset: "ETH",
    name: "Ethereum 2.0",
    apy: 5.2,
    minStake: 0.1,
    totalStaked: 125000,
    flexible: true,
    rewards: "Daily"
  },
  {
    asset: "SOL",
    name: "Solana",
    apy: 7.8,
    minStake: 1,
    totalStaked: 85000,
    flexible: true,
    rewards: "Epoch (~2 days)"
  },
  {
    asset: "ADA",
    name: "Cardano",
    apy: 4.5,
    minStake: 100,
    totalStaked: 2400000,
    flexible: true,
    rewards: "Every 5 days"
  },
  {
    asset: "MATIC",
    name: "Polygon",
    apy: 6.3,
    minStake: 10,
    totalStaked: 180000,
    flexible: false,
    lockPeriod: 30,
    rewards: "Daily"
  },
]

// User's active stakes
const activeStakes = [
  {
    asset: "ETH",
    amount: 2.5,
    value: 4125,
    apy: 5.2,
    rewards: 14.28,
    startDate: "2025-09-15"
  },
  {
    asset: "SOL",
    amount: 50,
    value: 2210,
    apy: 7.8,
    rewards: 42.15,
    startDate: "2025-10-01"
  },
]

export default function StakingPage() {
  const totalStaked = activeStakes.reduce((sum, stake) => sum + stake.value, 0)
  const totalRewards = activeStakes.reduce((sum, stake) => sum + stake.rewards, 0)
  const avgApy = activeStakes.reduce((sum, stake) => sum + stake.apy, 0) / activeStakes.length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Earn with Staking</h1>
          <p className="text-muted-foreground">
            Stake your crypto and earn passive rewards
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Staked"
            value={`£${totalStaked.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            icon={Wallet}
            variant="primary"
          />
          <StatCard
            title="Total Rewards"
            value={`£${totalRewards.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            subtitle="All time earnings"
            icon={Award}
            variant="success"
          />
          <StatCard
            title="Average APY"
            value={`${avgApy.toFixed(1)}%`}
            subtitle="Across all pools"
            icon={TrendingUp}
          />
        </div>

        {/* Info Banner */}
        <Card className="p-4 bg-info/5 border-info/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-info mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium mb-1">How Staking Works</p>
              <p className="text-muted-foreground">
                When you stake crypto, you help secure the blockchain network and earn rewards. 
                Your funds remain yours and you can unstake anytime (flexible pools) or after the lock period (locked pools).
              </p>
            </div>
          </div>
        </Card>

        {/* Available Pools */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Available Staking Pools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stakingPools.map((pool) => (
              <StakingPoolCard
                key={pool.asset}
                pool={pool}
                userBalance={pool.asset === "ETH" ? 2.5 : pool.asset === "SOL" ? 50 : 0}
                onStake={() => alert(`Staking ${pool.asset}...`)}
              />
            ))}
          </div>
        </div>

        {/* Active Stakes */}
        {activeStakes.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Active Stakes</h2>
            <Card className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-sm text-muted-foreground">
                      <th className="text-left font-medium pb-3">Asset</th>
                      <th className="text-right font-medium pb-3">Amount</th>
                      <th className="text-right font-medium pb-3">Value</th>
                      <th className="text-right font-medium pb-3">APY</th>
                      <th className="text-right font-medium pb-3">Rewards</th>
                      <th className="text-right font-medium pb-3">Staking Since</th>
                      <th className="text-right font-medium pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeStakes.map((stake) => (
                      <tr
                        key={stake.asset}
                        className="border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <AssetIcon symbol={stake.asset} size="sm" />
                            <span className="font-medium">{stake.asset}</span>
                          </div>
                        </td>
                        <td className="text-right font-mono">
                          {stake.amount} {stake.asset}
                        </td>
                        <td className="text-right font-mono font-semibold">
                          £{stake.value.toLocaleString('en-GB')}
                        </td>
                        <td className="text-right font-mono text-success font-semibold">
                          {stake.apy}%
                        </td>
                        <td className="text-right font-mono text-success">
                          +£{stake.rewards.toFixed(2)}
                        </td>
                        <td className="text-right text-sm text-muted-foreground">
                          {new Date(stake.startDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="text-right">
                          <Button variant="outline" size="sm">
                            Unstake
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

