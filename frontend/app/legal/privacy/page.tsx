import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="outline">Last Updated: October 10, 2025</Badge>
              <Badge variant="outline">GDPR Compliant</Badge>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth</li>
              <li><strong>Identity Documents:</strong> Passport, driver's license, or national ID (for KYC)</li>
              <li><strong>Financial Information:</strong> Bank account details, transaction history</li>
              <li><strong>Technical Data:</strong> IP address, device information, browser type</li>
              <li><strong>Usage Data:</strong> How you interact with our Platform</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Verify your identity and comply with KYC/AML regulations</li>
              <li>Process your transactions and provide our services</li>
              <li>Prevent fraud and enhance security</li>
              <li>Communicate with you about your account and transactions</li>
              <li>Comply with legal obligations and regulatory requirements</li>
              <li>Improve our services and user experience</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Data Protection & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Encryption of data in transit and at rest (AES-256)</li>
              <li>Multi-factor authentication</li>
              <li>Regular security audits</li>
              <li>Access controls and monitoring</li>
              <li>95% of funds in cold storage</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Your Rights (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under UK GDPR, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data ("right to be forgotten")</li>
              <li>Export your data in a portable format</li>
              <li>Object to processing of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, contact us at: <strong>privacy@bitcurrent.co.uk</strong>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as necessary to provide services and comply with legal obligations. 
              KYC data is retained for 5 years after account closure as required by UK AML regulations.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use trusted third-party services for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li><strong>Identity Verification:</strong> Onfido (KYC provider)</li>
              <li><strong>Payment Processing:</strong> Stripe, Clear Bank</li>
              <li><strong>Communication:</strong> SendGrid (email), Twilio (SMS)</li>
              <li><strong>Analytics:</strong> Datadog (monitoring)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These providers have their own privacy policies and security measures.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and security. Analytics cookies are optional 
              and can be disabled in your browser settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. International Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is primarily stored in the UK/EU. If transferred internationally, we ensure 
              adequate protection through standard contractual clauses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not intended for persons under 18 years of age. We do not knowingly 
              collect data from children.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy. We will notify you of significant changes via email 
              or platform notification.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions or to exercise your rights:<br />
              <strong>Email:</strong> privacy@bitcurrent.co.uk<br />
              <strong>Data Protection Officer:</strong> dpo@bitcurrent.co.uk<br />
              <strong>Address:</strong> BitCurrent Exchange Ltd, London, United Kingdom
            </p>
          </section>

          <div className="pt-8 mt-8 border-t border-border text-sm text-muted-foreground">
            <p>© 2025 BitCurrent Exchange Ltd. Your privacy is important to us.</p>
          </div>
        </div>
      </div>
    </div>
  )
}




