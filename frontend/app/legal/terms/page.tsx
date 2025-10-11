import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | BitCurrent",
  description: "Terms and conditions for using BitCurrent crypto trading platform"
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: October 11, 2025</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          
          <section>
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using BitCurrent ("we", "our", "us"), you agree to be bound by these Terms of Service 
              and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited 
              from using or accessing this platform.
            </p>
          </section>

          <section>
            <h2>2. Company Information</h2>
            <p>
              BitCurrent Ltd is a company registered in England and Wales (Company Number: PENDING).
            </p>
            <p>
              <strong>Regulatory Status:</strong> BitCurrent is applying for registration as a crypto asset business 
              with the Financial Conduct Authority (FCA) under the Money Laundering, Terrorist Financing and Transfer 
              of Funds (Information on the Payer) Regulations 2017.
            </p>
            <p className="font-semibold text-amber-600 dark:text-amber-500">
              ⚠️ IMPORTANT: BitCurrent is NOT FCA authorized for investment activities. This registration does not mean 
              the FCA has approved our business model or confirmed it is compliant with all financial services regulations.
            </p>
          </section>

          <section>
            <h2>3. Service Description</h2>
            <p>
              BitCurrent operates as a <strong>non-custodial broker service</strong>. This means:
            </p>
            <ul>
              <li>We do NOT hold, custody, or control your cryptocurrency assets</li>
              <li>All trades are executed through licensed third-party brokers (Alpaca Markets LLC)</li>
              <li>You maintain full control and responsibility for your assets</li>
              <li>We act solely as an intermediary to facilitate your trades</li>
            </ul>
          </section>

          <section>
            <h2>4. Risk Disclosure</h2>
            <p className="font-semibold text-red-600 dark:text-red-500">
              CRYPTOCURRENCY TRADING IS HIGHLY RISKY. YOU COULD LOSE ALL YOUR INVESTED CAPITAL.
            </p>
            <p>
              Before using our services, you must understand and accept that:
            </p>
            <ul>
              <li>Cryptocurrency prices are extremely volatile and can fluctuate dramatically</li>
              <li>You may lose some or all of the money you invest</li>
              <li>Past performance is not indicative of future results</li>
              <li>You should only invest money you can afford to lose completely</li>
              <li>Cryptocurrency investments are NOT covered by FSCS protection</li>
              <li>Cryptocurrency investments are NOT covered by the Financial Ombudsman Service</li>
              <li>You are responsible for understanding the tax implications of your trades</li>
            </ul>
            <p>
              By using BitCurrent, you acknowledge you have read and understood the full 
              <a href="/legal/risk-disclosure" className="text-primary hover:underline"> Risk Disclosure Statement</a>.
            </p>
          </section>

          <section>
            <h2>5. Eligibility</h2>
            <p>To use BitCurrent, you must:</p>
            <ul>
              <li>Be at least 18 years old</li>
              <li>Be a legal resident of the United Kingdom</li>
              <li>Have legal capacity to enter into binding contracts</li>
              <li>Not be located in a sanctioned country</li>
              <li>Complete our identity verification (KYC) process</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2>6. Account Registration and Security</h2>
            <p><strong>6.1 Account Creation:</strong> You must provide accurate, complete information during registration.</p>
            <p><strong>6.2 Security:</strong> You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
              <li>Using strong passwords and enabling two-factor authentication</li>
            </ul>
            <p><strong>6.3 One Account:</strong> You may only create one account per person.</p>
          </section>

          <section>
            <h2>7. Know Your Customer (KYC) and Anti-Money Laundering (AML)</h2>
            <p>
              In compliance with UK Money Laundering Regulations, we require all users to complete identity 
              verification. You agree to:
            </p>
            <ul>
              <li>Provide valid government-issued identification</li>
              <li>Provide proof of address</li>
              <li>Provide source of funds information if requested</li>
              <li>Allow us to conduct ongoing monitoring of your transactions</li>
              <li>Consent to us reporting suspicious activities to the National Crime Agency (NCA)</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate your account if you fail to complete KYC or if we suspect 
              fraudulent activity.
            </p>
          </section>

          <section>
            <h2>8. Trading and Fees</h2>
            <p><strong>8.1 Trading Fee:</strong> We charge 0.25% per trade (buy or sell).</p>
            <p><strong>8.2 Deposits:</strong> Bank transfers are free. Card payments (when available) may incur fees.</p>
            <p><strong>8.3 Withdrawals:</strong> GBP withdrawals over £100 are free. Crypto withdrawals incur network fees.</p>
            <p><strong>8.4 Fee Changes:</strong> We reserve the right to change fees with 14 days' notice.</p>
            <p><strong>8.5 Price Execution:</strong> Market orders execute at the best available price, which may differ from quoted prices.</p>
          </section>

          <section>
            <h2>9. Deposits and Withdrawals</h2>
            <p><strong>9.1 Deposits:</strong> You may deposit via bank transfer. Card deposits coming soon.</p>
            <p><strong>9.2 Processing Time:</strong> Bank transfers typically process within 2-4 hours.</p>
            <p><strong>9.3 Withdrawals:</strong> Withdrawal requests are processed manually and may take 24-48 hours.</p>
            <p><strong>9.4 Withdrawal Limits:</strong> Daily limits apply based on your verification level.</p>
            <p><strong>9.5 AML Checks:</strong> Large withdrawals may require additional verification.</p>
          </section>

          <section>
            <h2>10. Prohibited Activities</h2>
            <p>You agree NOT to:</p>
            <ul>
              <li>Use our service for money laundering or terrorist financing</li>
              <li>Provide false or misleading information</li>
              <li>Use automated trading bots without permission</li>
              <li>Manipulate markets or engage in wash trading</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Transfer your account to another person</li>
              <li>Use our service if you are under 18 years old</li>
            </ul>
          </section>

          <section>
            <h2>11. Limitation of Liability</h2>
            <p className="font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BITCURRENT SHALL NOT BE LIABLE FOR:
            </p>
            <ul>
              <li>Any losses resulting from cryptocurrency price volatility</li>
              <li>Losses due to third-party broker failures (Alpaca Markets)</li>
              <li>System downtime, errors, or technical issues</li>
              <li>Loss of profits, data, or opportunities</li>
              <li>Indirect, consequential, or punitive damages</li>
            </ul>
            <p>
              Our maximum liability to you for any claim is limited to the fees you paid to us in the 12 months 
              preceding the claim.
            </p>
          </section>

          <section>
            <h2>12. Intellectual Property</h2>
            <p>
              All content, trademarks, and data on this platform, including but not limited to software, databases, 
              text, graphics, icons, and logos, are the property of BitCurrent or our licensors and are protected 
              by copyright and trademark laws.
            </p>
          </section>

          <section>
            <h2>13. Termination</h2>
            <p>We may terminate or suspend your account immediately, without notice, for:</p>
            <ul>
              <li>Violation of these Terms</li>
              <li>Suspected fraudulent or illegal activity</li>
              <li>Failure to complete KYC verification</li>
              <li>Regulatory requirements</li>
            </ul>
            <p>
              Upon termination, you must withdraw all funds within 30 days. After 30 days, we may return funds to 
              your verified bank account minus applicable fees.
            </p>
          </section>

          <section>
            <h2>14. Complaints and Disputes</h2>
            <p>
              If you have a complaint, please contact us at: <a href="mailto:complaints@bitcurrent.co.uk" className="text-primary hover:underline">complaints@bitcurrent.co.uk</a>
            </p>
            <p>
              We will acknowledge complaints within 5 business days and aim to resolve them within 8 weeks.
            </p>
            <p>
              If you are not satisfied with our response, you may refer your complaint to the Financial Ombudsman 
              Service: <a href="https://www.financial-ombudsman.org.uk" target="_blank" rel="noopener" className="text-primary hover:underline">www.financial-ombudsman.org.uk</a>
            </p>
          </section>

          <section>
            <h2>15. Governing Law</h2>
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes will be subject to the 
              exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2>16. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify you of material changes via email or platform 
              notification at least 14 days before they take effect. Your continued use of the platform after changes 
              take effect constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2>17. Contact Information</h2>
            <p>
              For questions about these Terms, contact us at:
            </p>
            <p>
              <strong>Email:</strong> legal@bitcurrent.co.uk<br />
              <strong>Support:</strong> support@bitcurrent.co.uk<br />
              <strong>Address:</strong> [To be added upon company registration]
            </p>
          </section>

          <div className="mt-12 p-6 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="font-semibold mb-2">⚠️ Important Notice</p>
            <p className="text-sm">
              This is a high-risk investment. Don't invest unless you're prepared to lose all the money you invest. 
              This is not suitable for everyone. Seek independent financial advice if you are unsure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
