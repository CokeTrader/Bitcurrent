"use client"

import { Card } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: October 13, 2025</p>

          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-2">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Email address and password</li>
                <li>Name and date of birth</li>
                <li>Government ID for KYC verification</li>
                <li>Bank account details for withdrawals</li>
                <li>Trading activity and transaction history</li>
                <li>Device information and IP address</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-2">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Provide and maintain our Service</li>
                <li>Process trades and transactions</li>
                <li>Verify your identity (KYC/AML compliance)</li>
                <li>Send you important updates and notifications</li>
                <li>Detect and prevent fraud</li>
                <li>Comply with legal obligations</li>
                <li>Improve our Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Data Sharing</h2>
              <p className="text-muted-foreground mb-2">
                We share your information with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Alpaca Markets:</strong> For trade execution</li>
                <li><strong>Stripe:</strong> For payment processing</li>
                <li><strong>KYC Providers:</strong> For identity verification</li>
                <li><strong>Law Enforcement:</strong> When legally required</li>
                <li><strong>Service Providers:</strong> For hosting and analytics</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                We never sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures including:
                encryption (SSL/TLS), cold storage for 95% of funds, 2FA authentication,
                regular security audits, and access controls. However, no method of transmission
                over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Your Rights (GDPR)</h2>
              <p className="text-muted-foreground mb-2">
                Under UK GDPR, you have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Access your personal data</li>
                <li>Rectify inaccurate data</li>
                <li>Request erasure of your data</li>
                <li>Object to processing</li>
                <li>Data portability</li>
                <li>Withdraw consent</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                To exercise these rights, contact{' '}
                <a href="mailto:privacy@bitcurrent.co.uk" className="text-primary hover:underline">
                  privacy@bitcurrent.co.uk
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your information for as long as your account is active, plus 7 years
                after account closure as required by UK financial regulations and AML laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Cookies</h2>
              <p className="text-muted-foreground">
                We use essential cookies for authentication and optional analytics cookies.
                You can manage cookie preferences via the cookie banner on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Changes to Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of
                any changes by posting the new Privacy Policy on this page and updating the
                "last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Contact Us</h2>
              <p className="text-muted-foreground">
                For privacy-related questions:{' '}
                <a href="mailto:privacy@bitcurrent.co.uk" className="text-primary hover:underline">
                  privacy@bitcurrent.co.uk
                </a>
              </p>
            </section>
          </Card>
        </div>
      </main>
    </div>
  )
}
