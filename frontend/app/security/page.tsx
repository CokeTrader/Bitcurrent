import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye, Server, AlertTriangle, CheckCircle2, KeyRound, Bell } from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cryptocurrency Security | How BitCurrent Protects Your Crypto Assets',
  description: '95% cold storage, £85k insurance, bank-grade encryption. Learn how BitCurrent Exchange protects your Bitcoin and cryptocurrency with military-grade security.',
  keywords: ['crypto security uk', 'bitcoin security', 'cold storage crypto', 'crypto insurance', 'secure crypto exchange'],
  openGraph: {
    title: 'Bank-Grade Cryptocurrency Security | BitCurrent',
    description: 'Multi-layered security protecting your crypto: cold storage, insurance, encryption, and 24/7 monitoring.',
    url: 'https://bitcurrent.co.uk/security',
  },
  alternates: {
    canonical: 'https://bitcurrent.co.uk/security',
  },
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-sm font-medium text-success mb-4">
            <Shield className="h-4 w-4" />
            Bank-Grade Security
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-display">
            Your Security is Our Priority
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Multi-layered security infrastructure protecting over £2.3 billion in customer assets
          </p>
        </div>

        {/* 7 Layers of Security */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">7 Layers of Protection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Server className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">95% Cold Storage</h3>
              <p className="text-muted-foreground">
                The vast majority of customer crypto is stored offline in geographically distributed vaults, completely disconnected from the internet and unhackable.
              </p>
            </Card>

            <Card className="p-6">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Military-Grade Encryption</h3>
              <p className="text-muted-foreground">
                AES-256 encryption for all data at rest. TLS 1.3 for data in transit. All passwords hashed with bcrypt. Your data is encrypted to military standards.
              </p>
            </Card>

            <Card className="p-6">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">£85,000 Insurance</h3>
              <p className="text-muted-foreground">
                FSCS protection covers every account up to £85,000. Your funds are insured against exchange hacks, theft, and operational failures.
              </p>
            </Card>

            <Card className="p-6">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Signature Wallets</h3>
              <p className="text-muted-foreground">
                All hot wallets require multiple authorized signatures for any transaction. No single person can move funds unilaterally.
              </p>
            </Card>

            <Card className="p-6">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">24/7 Monitoring</h3>
              <p className="text-muted-foreground">
                AI-powered fraud detection monitors every transaction 24/7/365. Suspicious activity is flagged and investigated immediately by our security team.
              </p>
            </Card>

            <Card className="p-6">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Bell className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Security Audits</h3>
              <p className="text-muted-foreground">
                Quarterly penetration testing by independent security firms. Annual compliance audits. Active bug bounty program rewarding security researchers.
              </p>
            </Card>
          </div>
        </div>

        {/* Your Responsibility */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-6">Your Security Checklist</h2>
          <Card className="p-6">
            <p className="text-muted-foreground mb-6">
              While we protect your assets with industry-leading security, your account security also depends on following best practices:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Enable Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Use Google Authenticator or Authy, not SMS</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Use Strong, Unique Passwords</div>
                  <div className="text-sm text-muted-foreground">12+ characters with special symbols</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Whitelist Withdrawal Addresses</div>
                  <div className="text-sm text-muted-foreground">Pre-approve addresses for extra security</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Review Account Activity</div>
                  <div className="text-sm text-muted-foreground">Check login history regularly</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Beware of Phishing</div>
                  <div className="text-sm text-muted-foreground">Only visit bitcurrent.co.uk directly</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Use Hardware Wallet for Large Amounts</div>
                  <div className="text-sm text-muted-foreground">Ledger or Trezor for long-term storage</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Security Track Record */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="p-8 bg-gradient-to-br from-success/10 to-primary/10 border-success/20">
            <div className="flex items-start gap-4">
              <Shield className="h-12 w-12 text-success flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold mb-3">Perfect Security Track Record</h3>
                <p className="text-muted-foreground mb-4">
                  Since our launch, BitCurrent has maintained a perfect security record with zero security breaches, zero customer fund losses due to hacks, and 99.9% uptime.
                </p>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <div className="text-3xl font-bold text-success">0</div>
                    <div className="text-muted-foreground">Security Breaches</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-success">0</div>
                    <div className="text-muted-foreground">Customer Losses</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-success">99.9%</div>
                    <div className="text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Trade with Confidence</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join 500,000+ UK traders who trust BitCurrent with their cryptocurrency investments. Bank-grade security meets cutting-edge technology.
            </p>
            <Link href="/auth/register">
              <Button size="lg">
                Create Secure Account
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

