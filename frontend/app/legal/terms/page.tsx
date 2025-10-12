"use client"

import { Card } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: October 13, 2025</p>

          <Card className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using BitCurrent ("Service"), you agree to be bound by these Terms of Service.
                If you disagree with any part of the terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Eligibility</h2>
              <p className="text-muted-foreground mb-2">
                To use BitCurrent, you must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Be at least 18 years old</li>
                <li>Be a resident of the United Kingdom</li>
                <li>Complete KYC verification</li>
                <li>Not be located in a sanctioned jurisdiction</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Account Registration</h2>
              <p className="text-muted-foreground">
                You must provide accurate, current, and complete information during registration.
                You are responsible for maintaining the security of your account and password.
                BitCurrent cannot and will not be liable for any loss or damage from your failure to
                comply with this security obligation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Trading Fees</h2>
              <p className="text-muted-foreground mb-2">
                BitCurrent charges a 0.25% fee on all cryptocurrency trades. Fees are:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Deducted automatically from each trade</li>
                <li>Non-refundable</li>
                <li>Subject to change with 30 days notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Risk Disclosure</h2>
              <p className="text-muted-foreground mb-2">
                Cryptocurrency trading carries substantial risk. You acknowledge that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Cryptocurrency prices are highly volatile</li>
                <li>You may lose all funds invested</li>
                <li>Past performance does not indicate future results</li>
                <li>You should only invest what you can afford to lose</li>
                <li>75% of retail traders lose money</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Prohibited Activities</h2>
              <p className="text-muted-foreground mb-2">
                You may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Use the Service for illegal activities</li>
                <li>Attempt to manipulate markets</li>
                <li>Create multiple accounts</li>
                <li>Use automated trading bots without approval</li>
                <li>Share account credentials</li>
                <li>Engage in money laundering</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Deposits and Withdrawals</h2>
              <p className="text-muted-foreground">
                Deposits via Stripe are credited immediately. Bank withdrawals take 1-2 business days.
                Crypto withdrawals take 10-30 minutes. BitCurrent reserves the right to delay or decline
                withdrawals for compliance or security reasons.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Suspension and Termination</h2>
              <p className="text-muted-foreground">
                BitCurrent may suspend or terminate your account immediately if you violate these Terms,
                engage in fraudulent activity, or if required by law. You may close your account at any
                time by withdrawing all funds and contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                BitCurrent shall not be liable for any indirect, incidental, special, consequential, or
                punitive damages resulting from your use of the Service, including but not limited to
                trading losses, lost profits, or data loss.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">10. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at{' '}
                <a href="mailto:legal@bitcurrent.co.uk" className="text-primary hover:underline">
                  legal@bitcurrent.co.uk
                </a>
              </p>
            </section>
          </Card>
        </div>
      </main>
    </div>
  )
}
