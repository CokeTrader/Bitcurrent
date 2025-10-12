"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function FeesPage() {
  const comparison = [
    { platform: "BitCurrent", tradingFee: "0.25%", depositFee: "Free", withdrawalFee: "Free", minDeposit: "£10" },
    { platform: "Coinbase", tradingFee: "1.49%", depositFee: "Free", withdrawalFee: "£0.15", minDeposit: "£2" },
    { platform: "Binance", tradingFee: "0.50%", depositFee: "1.8%", withdrawalFee: "Variable", minDeposit: "£15" },
    { platform: "Kraken", tradingFee: "0.26%", depositFee: "Free", withdrawalFee: "£1.20", minDeposit: "£1" }
  ]

  const examples = [
    { amount: 100, bitcurrent: 0.25, coinbase: 1.49, savings: 1.24 },
    { amount: 500, bitcurrent: 1.25, coinbase: 7.45, savings: 6.20 },
    { amount: 1000, bitcurrent: 2.50, coinbase: 14.90, savings: 12.40 },
    { amount: 5000, bitcurrent: 12.50, coinbase: 74.50, savings: 62.00 }
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground">
              No hidden fees. Just 0.25% per trade - 6x cheaper than Coinbase
            </p>
          </div>

          {/* Main Fee Card */}
          <Card className="p-12 mb-12 text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <div className="text-6xl font-bold text-green-600 mb-2">0.25%</div>
            <div className="text-2xl font-semibold mb-4">Trading Fee</div>
            <p className="text-lg text-muted-foreground mb-6">
              Same low fee for all trades, regardless of size
            </p>
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>No deposit fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>No withdrawal fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span>No hidden charges</span>
              </div>
            </div>
          </Card>

          {/* Comparison Table */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">How We Compare</h2>
            <Card className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-bold">Platform</th>
                    <th className="text-left p-4 font-bold">Trading Fee</th>
                    <th className="text-left p-4 font-bold">Deposit Fee</th>
                    <th className="text-left p-4 font-bold">Withdrawal Fee</th>
                    <th className="text-left p-4 font-bold">Min. Deposit</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, idx) => (
                    <tr key={row.platform} className={`border-b ${idx === 0 ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                      <td className="p-4 font-semibold">
                        {row.platform}
                        {idx === 0 && <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">Best</span>}
                      </td>
                      <td className="p-4">{row.tradingFee}</td>
                      <td className="p-4">{row.depositFee}</td>
                      <td className="p-4">{row.withdrawalFee}</td>
                      <td className="p-4">{row.minDeposit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Savings Examples */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">How Much You Save</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {examples.map((example) => (
                <Card key={example.amount} className="p-6">
                  <div className="text-2xl font-bold mb-4">£{example.amount} Trade</div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BitCurrent Fee:</span>
                      <span className="font-semibold text-green-600">£{example.bitcurrent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coinbase Fee:</span>
                      <span className="font-semibold">£{example.coinbase.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">You Save:</span>
                      <span className="font-bold text-green-600">£{example.savings.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Additional Fees */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Complete Fee Breakdown</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Free Services
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>GBP deposits (via Stripe)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Bank withdrawals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Account maintenance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Price alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Real-time market data</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Advanced charts</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <X className="h-5 w-5 text-red-600" />
                  What We Don't Charge
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span>Inactivity fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span>Account opening fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span>Minimum balance fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span>Statement fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span>Customer support fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span>Hidden spreads</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <Card className="p-8 text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <h2 className="text-3xl font-bold mb-4">Start Saving on Fees Today</h2>
            <p className="text-lg mb-6 opacity-90">
              Join 500+ traders who switched to BitCurrent and saved thousands
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="font-bold">
                Get £10 Free - Sign Up Now →
              </Button>
            </Link>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
