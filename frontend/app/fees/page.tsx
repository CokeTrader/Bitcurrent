import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Info } from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crypto Trading Fees UK | Transparent Pricing - BitCurrent Exchange',
  description: 'Clear, transparent cryptocurrency trading fees. 0.1% trading fee, free GBP deposits, no hidden charges. Compare our fees with other UK crypto exchanges.',
  keywords: ['crypto trading fees', 'bitcoin trading fees', 'exchange fees uk', 'crypto fee comparison', 'cheapest crypto exchange uk'],
  openGraph: {
    title: 'Transparent Crypto Trading Fees | BitCurrent',
    description: '0.1% trading fees, free deposits, no hidden charges. See exactly what you pay.',
    url: 'https://bitcurrent.co.uk/fees',
  },
  alternates: {
    canonical: 'https://bitcurrent.co.uk/fees',
  },
}

export default function FeesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Badge variant="outline" className="mb-4">
            No Hidden Fees
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-display">
            Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Simple, honest fees. No surprises. Pay less, trade more.
          </p>
        </div>

        {/* Main Fee Table */}
        <div className="max-w-5xl mx-auto mb-12">
          <Card className="overflow-hidden">
            <div className="bg-primary/5 p-6 border-b border-border">
              <h2 className="text-2xl font-bold">Trading Fees</h2>
              <p className="text-muted-foreground">Competitive fees that scale with your volume</p>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4">30-Day Volume</th>
                    <th className="text-right py-4">Maker Fee</th>
                    <th className="text-right py-4">Taker Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-4">£0 - £10,000</td>
                    <td className="text-right font-semibold text-primary">0.10%</td>
                    <td className="text-right font-semibold text-primary">0.15%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4">£10,000 - £50,000</td>
                    <td className="text-right font-semibold text-success">0.08%</td>
                    <td className="text-right font-semibold text-success">0.12%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4">£50,000 - £100,000</td>
                    <td className="text-right font-semibold text-success">0.06%</td>
                    <td className="text-right font-semibold text-success">0.10%</td>
                  </tr>
                  <tr>
                    <td className="py-4">£100,000+</td>
                    <td className="text-right font-semibold text-success">0.05%</td>
                    <td className="text-right font-semibold text-success">0.08%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Other Fees */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deposit Fees */}
            <Card>
              <div className="bg-primary/5 p-4 border-b border-border">
                <h3 className="font-bold">Deposit Fees</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    Faster Payments (Bank Transfer)
                  </span>
                  <span className="font-semibold text-success">FREE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    BACS Transfer
                  </span>
                  <span className="font-semibold text-success">FREE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Debit Card</span>
                  <span className="font-semibold">1.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Credit Card</span>
                  <span className="font-semibold">2.5%</span>
                </div>
              </div>
            </Card>

            {/* Withdrawal Fees */}
            <Card>
              <div className="bg-primary/5 p-4 border-b border-border">
                <h3 className="font-bold">Withdrawal Fees</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    GBP (Over £100)
                  </span>
                  <span className="font-semibold text-success">FREE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>GBP (Under £100)</span>
                  <span className="font-semibold">£2.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    Cryptocurrency
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </span>
                  <span className="font-semibold">Network fee only</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="max-w-5xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">How We Compare</h2>
          <Card className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4">Exchange</th>
                  <th className="text-right p-4">Trading Fee</th>
                  <th className="text-right p-4">Deposit (Bank)</th>
                  <th className="text-right p-4">Withdrawal (GBP)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border bg-primary/5">
                  <td className="p-4 font-bold">BitCurrent</td>
                  <td className="text-right text-success font-semibold">0.10%</td>
                  <td className="text-right text-success font-semibold">FREE</td>
                  <td className="text-right text-success font-semibold">FREE*</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Coinbase</td>
                  <td className="text-right">1.49%</td>
                  <td className="text-right">FREE</td>
                  <td className="text-right">FREE</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Kraken</td>
                  <td className="text-right">0.26%</td>
                  <td className="text-right">FREE</td>
                  <td className="text-right">FREE</td>
                </tr>
                <tr>
                  <td className="p-4">Crypto.com</td>
                  <td className="text-right">0.40%</td>
                  <td className="text-right">FREE</td>
                  <td className="text-right">£1.00</td>
                </tr>
              </tbody>
            </table>
            <div className="p-4 text-xs text-muted-foreground">
              *Free for withdrawals over £100. £2 fee for withdrawals under £100.
            </div>
          </Card>
        </div>

        {/* Fee Savings Calculator */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="p-6 bg-gradient-to-br from-success/5 to-primary/5">
            <h3 className="text-2xl font-bold mb-4">Potential Savings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <div>
                  <div className="font-semibold">Trading £1,000/month</div>
                  <div className="text-sm text-muted-foreground">BitCurrent vs Coinbase</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-success">Save £167/year</div>
                </div>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <div>
                  <div className="font-semibold">Trading £5,000/month</div>
                  <div className="text-sm text-muted-foreground">BitCurrent vs Coinbase</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-success">Save £834/year</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Trading £10,000/month</div>
                  <div className="text-sm text-muted-foreground">BitCurrent vs Coinbase</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-success">Save £1,668/year</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* What's Included */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">What's Included (No Extra Cost)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Real-time market data',
              'Advanced trading charts',
              'Mobile app access',
              '24/7 customer support',
              'API access',
              'Tax reports',
              'Portfolio tracking',
              'Price alerts',
              'Instant GBP deposits',
              'Cold storage security',
              'Two-factor authentication',
              '£85,000 insurance'
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Fee FAQs</h2>
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-bold mb-2">What's the difference between maker and taker fees?</h3>
              <p className="text-muted-foreground">
                Maker fees apply when you place a limit order that's added to the order book (providing liquidity). Taker fees apply when you place a market order that immediately matches an existing order (taking liquidity). Maker fees are lower (0.10% vs 0.15%) to encourage liquidity provision.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">Are there any hidden fees?</h3>
              <p className="text-muted-foreground">
                No. All fees are clearly displayed before you confirm any transaction. We never charge unexpected or hidden fees. The only variable cost is blockchain network fees for cryptocurrency withdrawals, which we pass through at cost with no markup.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">How do I qualify for lower fees?</h3>
              <p className="text-muted-foreground">
                Fee tiers are based on your 30-day trading volume. Trade £10,000 or more per month to automatically qualify for reduced fees. Institutional traders can contact us for custom fee schedules.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-2">Do you charge inactivity fees?</h3>
              <p className="text-muted-foreground">
                No. Unlike some exchanges, BitCurrent never charges inactivity fees. Your account remains free regardless of how often you trade.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto mt-12">
          <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-success/5">
            <h2 className="text-2xl font-bold mb-4">Start Saving on Trading Fees</h2>
            <p className="text-muted-foreground mb-6">
              Join BitCurrent and pay 10x less in fees compared to mainstream exchanges. More profits in your pocket.
            </p>
            <Link href="/auth/register">
              <Button size="lg">
                Create Free Account
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

