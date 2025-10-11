"use client"

import * as React from "react"
import { WalletCard } from "@/components/wallets/wallet-card"
import { StatCard } from "@/components/ui/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AssetIcon } from "@/components/ui/asset-icon"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Search, ExternalLink } from "lucide-react"

// Fetch wallet data with REAL prices
async function fetchWalletData() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano&vs_currencies=gbp&include_24hr_change=true', {
      headers: { 'x-cg-demo-api-key': 'CG-zYnaYNPafFEBwVto94yj17Ey' }
    })
    const data = await response.json()
    
    // Demo balances (in production, fetch from backend)
    const balances = {
      BTC: 0.42847,
      ETH: 2.5,
      SOL: 50.2,
      ADA: 1250
    }
    
    return [
      {
        asset: "BTC",
        name: "Bitcoin",
        balance: balances.BTC,
        value: balances.BTC * data.bitcoin.gbp,
        change24h: data.bitcoin.gbp_24h_change,
        price: data.bitcoin.gbp,
        depositAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        canStake: false
      },
      {
        asset: "ETH",
        name: "Ethereum",
        balance: balances.ETH,
        value: balances.ETH * data.ethereum.gbp,
        change24h: data.ethereum.gbp_24h_change,
        price: data.ethereum.gbp,
        depositAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        canStake: true
      },
      {
        asset: "SOL",
        name: "Solana",
        balance: balances.SOL,
        value: balances.SOL * data.solana.gbp,
        change24h: data.solana.gbp_24h_change,
        price: data.solana.gbp,
        depositAddress: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
        canStake: true
      },
      {
        asset: "ADA",
        name: "Cardano",
        balance: balances.ADA,
        value: balances.ADA * data.cardano.gbp,
        change24h: data.cardano.gbp_24h_change,
        price: data.cardano.gbp,
        depositAddress: "addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        canStake: true
      },
    ]
  } catch (error) {
    console.error('Failed to fetch wallet data:', error)
    return []
  }
}

// Transaction history
const transactions = [
  {
    id: "1",
    type: "deposit",
    asset: "BTC",
    amount: 0.1,
    status: "confirmed",
    date: "2025-10-10T14:32:00Z",
    txHash: "a1b2c3d4e5f6..."
  },
  {
    id: "2",
    type: "send",
    asset: "ETH",
    amount: 0.5,
    status: "confirmed",
    date: "2025-10-09T10:15:00Z",
    txHash: "f6e5d4c3b2a1..."
  },
  {
    id: "3",
    type: "withdraw",
    asset: "SOL",
    amount: 10,
    status: "pending",
    date: "2025-10-10T22:10:00Z",
    txHash: "pending..."
  },
]

export default function WalletsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [wallets, setWallets] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  
  // Fetch real wallet data on mount
  React.useEffect(() => {
    fetchWalletData().then(data => {
      setWallets(data)
      setLoading(false)
    })
  }, [])

  const totalValue = wallets.reduce((sum, w) => sum + w.value, 0)
  const totalChange = wallets.reduce((sum, w) => sum + (w.value * w.change24h / 100), 0)
  const changePercentage = (totalChange / (totalValue - totalChange)) * 100

  const filteredWallets = wallets.filter(w =>
    w.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Wallets</h1>
            <p className="text-muted-foreground">
              Manage your cryptocurrency wallets
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg">
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </Button>
            <Button variant="outline" size="lg">
              <ArrowUpFromLine className="h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </div>

        {/* Total Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Balance"
            value={`£${totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            icon={Wallet}
            variant="primary"
          />
          <StatCard
            title="24h Change"
            value={`£${Math.abs(totalChange).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            change={{
              value: changePercentage,
              type: "percentage"
            }}
            trend={totalChange > 0 ? "up" : "down"}
            variant={totalChange > 0 ? "success" : "danger"}
          />
          <StatCard
            title="Total Assets"
            value={wallets.length.toString()}
            subtitle={`${wallets.filter(w => w.canStake).length} stakeable`}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wallets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Wallet Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWallets.map((wallet) => (
            <WalletCard key={wallet.asset} {...wallet} />
          ))}
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-sm text-muted-foreground">
                    <th className="text-left font-medium pb-3">Date & Time</th>
                    <th className="text-left font-medium pb-3">Type</th>
                    <th className="text-left font-medium pb-3">Asset</th>
                    <th className="text-right font-medium pb-3">Amount</th>
                    <th className="text-left font-medium pb-3">Status</th>
                    <th className="text-left font-medium pb-3">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 text-sm">
                        {new Date(tx.date).toLocaleString('en-GB')}
                      </td>
                      <td className="py-4">
                        <Badge variant="outline" className="capitalize">
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <AssetIcon symbol={tx.asset} size="sm" />
                          <span className="font-medium">{tx.asset}</span>
                        </div>
                      </td>
                      <td className="text-right font-mono">
                        {tx.type === "deposit" ? "+" : "-"}
                        {tx.amount} {tx.asset}
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={tx.status === "confirmed" ? "default" : "secondary"}
                          className={cn(
                            tx.status === "confirmed" && "bg-success text-white",
                            tx.status === "pending" && "bg-warning text-white"
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <a
                          href={`#`}
                          className="text-sm font-mono text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {tx.txHash}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

