import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Beta Notice */}
        <Card className="p-4 mb-8 bg-warning/5 border-warning/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Live Beta Platform</p>
              <p className="text-sm text-muted-foreground">
                BitCurrent is currently in beta testing. These terms are subject to change. 
                FCA registration is pending. Trade at your own risk.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="outline">Last Updated: October 10, 2025</Badge>
              <Badge variant="outline">Version 1.0 (Beta)</Badge>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using BitCurrent Exchange ("Platform", "we", "us", or "our"), you accept and agree 
              to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Beta Status & Regulatory Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Beta Testing:</strong> BitCurrent is currently operating as a BETA platform. Features may change 
              without notice, and the platform may experience downtime or technical issues.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>FCA Registration:</strong> BitCurrent is in the process of applying for registration with the 
              Financial Conduct Authority (FCA) as a cryptoasset business. Until registration is complete, we operate 
              under interim permissions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Risk Warning:</strong> Cryptocurrency investments are high risk. The value of cryptocurrencies 
              can go down as well as up. You may lose all of your invested capital. Only invest what you can afford to lose.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Account Registration & KYC</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use BitCurrent services, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Be at least 18 years old</li>
              <li>Provide accurate personal information</li>
              <li>Complete identity verification (KYC) as required by UK law</li>
              <li>Maintain the security of your account credentials</li>
              <li>Not use the Platform for illegal activities</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Trading & Fees</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Trading Fees:</strong> We charge a 0.5% fee on all trades (maker and taker). 
              Fees are clearly displayed before you confirm any transaction.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Withdrawal Fees:</strong> Cryptocurrency withdrawal fees vary by network conditions. 
              Fiat withdrawals via Faster Payments are free; CHAPS withdrawals incur a £5 fee.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Deposit Fees:</strong> Cryptocurrency and fiat deposits are free.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Security & Asset Protection</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Cold Storage:</strong> We store 95% of user funds in offline cold storage wallets 
              with multi-signature security.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Insurance:</strong> User funds are insured up to £85,000 (subject to terms).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>2FA Requirement:</strong> We strongly recommend (and may require) two-factor authentication 
              for account security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may not use BitCurrent for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Money laundering or terrorist financing</li>
              <li>Market manipulation or fraudulent trading</li>
              <li>Unauthorized access to other users' accounts</li>
              <li>Automated trading without prior approval</li>
              <li>Any activity that violates UK or international law</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Liability & Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>No Financial Advice:</strong> Nothing on this Platform constitutes financial, investment, 
              or legal advice. You are solely responsible for your trading decisions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Platform Availability:</strong> We strive for 99.9% uptime but do not guarantee uninterrupted 
              access. We are not liable for losses due to platform downtime.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Market Volatility:</strong> Cryptocurrency markets are highly volatile. Prices can change 
              rapidly, and you may experience significant losses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Data Protection & Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We comply with UK GDPR and Data Protection Act 2018. Your personal data is processed in accordance 
              with our <a href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your account if you violate these terms or if required by law. 
              You may close your account at any time by withdrawing all funds and contacting support.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of England and Wales. Any disputes will be subject to 
              the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, please contact us at: <br />
              <strong>Email:</strong> legal@bitcurrent.co.uk<br />
              <strong>Address:</strong> BitCurrent Exchange Ltd, London, United Kingdom
            </p>
          </section>

          <div className="pt-8 mt-8 border-t border-border text-sm text-muted-foreground">
            <p>
              © 2025 BitCurrent Exchange Ltd. All rights reserved. 
              BitCurrent is a trading name of BitCurrent Exchange Ltd, a company registered in England and Wales.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}




