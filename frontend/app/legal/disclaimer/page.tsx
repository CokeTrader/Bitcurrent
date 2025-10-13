"use client"

import { Card } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <h1 className="text-4xl font-bold">Risk Disclaimer</h1>
          </div>
          <p className="text-muted-foreground mb-8">Last updated: October 13, 2025</p>

          <Card className="p-8 space-y-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
            <div className="bg-red-600 text-white p-4 rounded-lg">
              <p className="font-bold text-lg mb-2">⚠️ HIGH RISK INVESTMENT WARNING</p>
              <p>
                Cryptocurrency trading is highly speculative and involves substantial risk of loss.
                You should only invest money you can afford to lose entirely.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold mb-3">Market Volatility</h2>
              <p className="text-muted-foreground">
                Cryptocurrency markets are extremely volatile. Prices can fluctuate dramatically
                within minutes. In the past 24 hours, nearly $1 billion in positions were liquidated
                due to market volatility. Your entire investment can be lost rapidly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">No Guaranteed Returns</h2>
              <p className="text-muted-foreground">
                BitCurrent does not guarantee any returns on your investments. Staking APY rates are
                estimates and may change. Past performance is not indicative of future results.
                You may receive back less than you invested.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">75% of Retail Traders Lose Money</h2>
              <p className="text-muted-foreground">
                Studies show that approximately 75% of retail cryptocurrency traders lose money.
                Trading requires knowledge, experience, and risk management skills. Do not trade
                with money you cannot afford to lose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Regulatory Risk</h2>
              <p className="text-muted-foreground">
                Cryptocurrency regulations are evolving. Regulatory changes may affect your ability
                to trade, access funds, or use certain features. BitCurrent operates in compliance
                with current UK regulations but cannot guarantee future regulatory outcomes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Technical Risks</h2>
              <p className="text-muted-foreground">
                Trading platforms can experience technical issues, downtime, or cyberattacks.
                While we implement security measures, no system is completely secure. You may
                be unable to access your account or execute trades during outages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">No Financial Advice</h2>
              <p className="text-muted-foreground">
                BitCurrent does not provide investment, financial, tax, or legal advice. Any
                information provided is for educational purposes only. Consult with qualified
                professionals before making investment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Your Responsibility</h2>
              <p className="text-muted-foreground mb-2">
                By using BitCurrent, you acknowledge that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>You understand the risks involved</li>
                <li>You are solely responsible for your trading decisions</li>
                <li>You will not hold BitCurrent liable for losses</li>
                <li>You have read and understood this disclaimer</li>
                <li>You are trading at your own risk</li>
              </ul>
            </section>

            <div className="bg-orange-100 dark:bg-orange-950/50 p-4 rounded-lg border-2 border-orange-600">
              <p className="font-bold text-orange-900 dark:text-orange-200">
                ONLY INVEST WHAT YOU CAN AFFORD TO LOSE
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}


