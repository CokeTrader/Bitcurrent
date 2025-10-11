import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export default function RiskDisclosurePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Warning Banner */}
        <Card className="p-6 mb-8 bg-danger/5 border-danger/20">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-8 w-8 text-danger mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-2 text-danger">High Risk Investment</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cryptocurrency trading carries substantial risk of loss. You should only invest money 
                you can afford to lose entirely. This disclosure outlines the key risks you should 
                understand before trading.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Risk Disclosure Statement</h1>
            <Badge variant="outline">Required by FCA Regulations</Badge>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Price Volatility Risk</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cryptocurrency prices are extremely volatile and can fluctuate significantly in very short periods. 
              Prices may rise or fall by 50% or more in a single day. You could lose all of your invested capital.
            </p>
            <Card className="p-4 mt-4 bg-muted/50">
              <p className="text-sm font-medium">Example:</p>
              <p className="text-sm text-muted-foreground mt-2">
                Bitcoin has historically experienced drops of 80%+ from peak prices. In 2022, Bitcoin fell 
                from $69,000 to $16,000 (-77%) in under 12 months.
              </p>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Regulatory & Legal Risk</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cryptocurrency regulation is evolving. Changes in law or regulation could:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Restrict or prohibit cryptocurrency trading</li>
              <li>Require additional compliance measures</li>
              <li>Impact the value or liquidity of your holdings</li>
              <li>Result in platform shutdown or service changes</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Liquidity Risk</h2>
            <p className="text-muted-foreground leading-relaxed">
              During periods of high volatility or market stress, you may not be able to buy or sell 
              cryptocurrencies at your desired price, or at all. Order execution is not guaranteed.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Technology & Security Risks</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cryptocurrency systems face technological risks:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Hacking and cyber attacks</li>
              <li>Software bugs or vulnerabilities</li>
              <li>Network congestion or failures</li>
              <li>Loss of private keys</li>
              <li>Smart contract failures</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Leverage & Margin Trading Risks</h2>
            <p className="text-muted-foreground leading-relaxed">
              If using margin trading (available to qualified users):
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>You can lose more than your initial investment</li>
              <li>Positions may be liquidated automatically</li>
              <li>Leverage amplifies both gains AND losses</li>
              <li>Interest charges apply to borrowed funds</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Staking Risks</h2>
            <p className="text-muted-foreground leading-relaxed">
              When staking cryptocurrency:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Funds may be locked for a period (lock-up risk)</li>
              <li>Network slashing could result in loss of staked funds</li>
              <li>APY rates are not guaranteed and may change</li>
              <li>The underlying asset's value may decline</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. No Guarantee of Profit</h2>
            <p className="text-muted-foreground leading-relaxed">
              Past performance is not indicative of future results. Cryptocurrency markets are unpredictable, 
              and you may lose money. We provide no guarantee of profit or protection from loss.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Platform & Operational Risks</h2>
            <p className="text-muted-foreground leading-relaxed">
              Risks related to our platform include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Technical failures or downtime</li>
              <li>Delayed order execution</li>
              <li>Incorrect price data</li>
              <li>Service interruptions</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Your Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Understanding these risks before trading</li>
              <li>Conducting your own research</li>
              <li>Seeking independent financial advice if needed</li>
              <li>Maintaining security of your account</li>
              <li>Complying with tax obligations</li>
            </ul>
          </section>

          <Card className="p-6 mt-8 bg-warning/5 border-warning/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-semibold mb-2">Important Notice</p>
                <p className="text-sm text-muted-foreground">
                  By using BitCurrent, you acknowledge that you have read, understood, and accepted 
                  these risks. If you do not understand these risks or cannot afford to lose money, 
                  you should not trade cryptocurrencies.
                </p>
              </div>
            </div>
          </Card>

          <div className="pt-8 mt-8 border-t border-border text-sm text-muted-foreground">
            <p>
              For questions about risk management, contact: <strong>support@bitcurrent.co.uk</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}




