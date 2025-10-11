"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useAccount, useBalance, useBlockNumber } from 'wagmi'
import { WalletConnect } from "@/components/web3/WalletConnect"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ExternalLink,
  TrendingUp,
  Shield,
  Zap,
  Network
} from "lucide-react"
import { supportedChains, getChainInfo } from "@/lib/web3/config"

export default function Web3Page() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({ address })
  const { data: blockNumber } = useBlockNumber({ watch: true })

  const chainInfo = chain ? getChainInfo(chain.id) : null

  // Mock transaction history
  const recentTransactions = [
    {
      id: 1,
      type: 'deposit',
      amount: '0.5 ETH',
      status: 'confirmed',
      timestamp: Date.now() - 3600000,
      hash: '0x1234...5678'
    },
    {
      id: 2,
      type: 'withdrawal',
      amount: '1.2 ETH',
      status: 'confirmed',
      timestamp: Date.now() - 7200000,
      hash: '0xabcd...efgh'
    },
  ]

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
            <h1 className="text-4xl font-bold mb-2 font-display">Web3 Wallet</h1>
            <p className="text-muted-foreground">
              Connect your wallet to deposit, withdraw, and trade crypto directly from your wallet
            </p>
          </div>

          {/* Features Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Self-Custody</p>
                  <p className="text-xs text-muted-foreground">You control your keys</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Network className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Multi-Chain</p>
                  <p className="text-xs text-muted-foreground">5+ networks supported</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium">Instant</p>
                  <p className="text-xs text-muted-foreground">Real-time transactions</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium">Low Fees</p>
                  <p className="text-xs text-muted-foreground">Optimized gas costs</p>
                </div>
              </div>
            </Card>
          </div>

          {!isConnected ? (
            /* Not Connected State */
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Connect Card */}
              <Card className="p-8">
                <div className="text-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Wallet className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2 font-display">Connect Your Wallet</h2>
                    <p className="text-muted-foreground">
                      Connect your Web3 wallet to start trading and managing your crypto assets
                    </p>
                  </div>
                  <WalletConnect showBalance={false} />
                  <p className="text-xs text-muted-foreground">
                    Supported wallets: MetaMask, WalletConnect, Coinbase Wallet, Rainbow, and more
                  </p>
                </div>
              </Card>

              {/* Supported Chains */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4 font-display">Supported Networks</h3>
                <div className="space-y-3">
                  {supportedChains.map((chain) => (
                    <div
                      key={chain.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{chain.icon}</span>
                        <div>
                          <p className="font-medium">{chain.name}</p>
                          <p className="text-xs text-muted-foreground">Chain ID: {chain.id}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{chain.symbol}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            /* Connected State */
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Wallet Info - Left */}
              <div className="lg:col-span-1">
                <WalletConnect variant="card" showBalance />
              </div>

              {/* Main Content - Right */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 font-display">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button size="lg" className="h-auto py-6 flex-col gap-2">
                      <ArrowDownLeft className="h-6 w-6" />
                      <span>Deposit</span>
                    </Button>
                    <Button size="lg" variant="outline" className="h-auto py-6 flex-col gap-2">
                      <ArrowUpRight className="h-6 w-6" />
                      <span>Withdraw</span>
                    </Button>
                  </div>
                </Card>

                {/* Network Info */}
                {chainInfo && blockNumber && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4 font-display">Network Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Current Block</p>
                        <p className="text-lg font-mono font-bold">
                          {blockNumber.toString()}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Network</p>
                        <p className="text-lg font-bold flex items-center gap-2">
                          <span>{chainInfo.icon}</span>
                          {chainInfo.name}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Recent Transactions */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-display">Recent Transactions</h3>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            tx.type === 'deposit' ? 'bg-success/10' : 'bg-danger/10'
                          }`}>
                            {tx.type === 'deposit' ? (
                              <ArrowDownLeft className={`h-5 w-5 text-success`} />
                            ) : (
                              <ArrowUpRight className={`h-5 w-5 text-danger`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{tx.type}</p>
                            <p className="text-xs text-muted-foreground font-mono">{tx.hash}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold">{tx.amount}</p>
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

