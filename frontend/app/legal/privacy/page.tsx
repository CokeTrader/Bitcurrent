import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | BitCurrent",
  description: "How BitCurrent protects and uses your personal data - GDPR compliant"
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: October 11, 2025</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          
          <section>
            <h2>1. Introduction</h2>
            <p>
              BitCurrent Ltd ("we", "us", "our") is committed to protecting your privacy and personal data. 
              This Privacy Policy explains how we collect, use, store, and protect your information in accordance 
              with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
            <p>
              <strong>Data Controller:</strong> BitCurrent Ltd<br />
              <strong>ICO Registration:</strong> [PENDING]<br />
              <strong>Contact:</strong> privacy@bitcurrent.co.uk
            </p>
          </section>

          <section>
            <h2>2. What Information We Collect</h2>
            
            <h3>2.1 Information You Provide:</h3>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, date of birth, phone number</li>
              <li><strong>Identity Verification:</strong> Government ID, proof of address, selfie photograph</li>
              <li><strong>Financial Information:</strong> Bank account details (for deposits/withdrawals only)</li>
              <li><strong>Transaction Data:</strong> Trading history, deposit/withdrawal records</li>
            </ul>

            <h3>2.2 Information We Collect Automatically:</h3>
            <ul>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, operating system</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, clicks, trading activity</li>
              <li><strong>Cookies:</strong> Session cookies, analytics cookies (see Cookie Policy)</li>
            </ul>

            <h3>2.3 Information from Third Parties:</h3>
            <ul>
              <li><strong>KYC Provider (Persona):</strong> Identity verification results</li>
              <li><strong>Payment Processors:</strong> Transaction confirmations</li>
              <li><strong>Broker (Alpaca):</strong> Trade execution data</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            
            <h3>3.1 Legal Basis for Processing:</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left">Purpose</th>
                  <th className="text-left">Legal Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>KYC/AML compliance</td>
                  <td>Legal obligation (Money Laundering Regulations)</td>
                </tr>
                <tr>
                  <td>Providing trading services</td>
                  <td>Contract performance</td>
                </tr>
                <tr>
                  <td>Customer support</td>
                  <td>Contract performance</td>
                </tr>
                <tr>
                  <td>Fraud prevention</td>
                  <td>Legitimate interests</td>
                </tr>
                <tr>
                  <td>Marketing emails</td>
                  <td>Consent (opt-in)</td>
                </tr>
                <tr>
                  <td>Platform improvement</td>
                  <td>Legitimate interests</td>
                </tr>
              </tbody>
            </table>

            <h3>3.2 Specific Uses:</h3>
            <ul>
              <li>Verify your identity and prevent fraud</li>
              <li>Execute your trades through third-party brokers</li>
              <li>Process deposits and withdrawals</li>
              <li>Comply with legal and regulatory obligations</li>
              <li>Detect and prevent money laundering</li>
              <li>Improve our services and user experience</li>
              <li>Send you important service notifications</li>
              <li>Respond to your support requests</li>
            </ul>
          </section>

          <section>
            <h2>4. How We Share Your Information</h2>
            <p>We may share your data with:</p>
            
            <h3>4.1 Service Providers:</h3>
            <ul>
              <li><strong>Persona (KYC):</strong> For identity verification</li>
              <li><strong>Alpaca Markets (Broker):</strong> For trade execution</li>
              <li><strong>Railway/Vercel (Hosting):</strong> For platform infrastructure</li>
              <li><strong>Checkout.com (Payments):</strong> For card processing (when available)</li>
            </ul>

            <h3>4.2 Legal Requirements:</h3>
            <p>We may disclose your information to:</p>
            <ul>
              <li>Law enforcement when legally required</li>
              <li>Financial Conduct Authority (FCA)</li>
              <li>National Crime Agency (NCA) for suspicious activity reports</li>
              <li>Courts or regulators in response to legal processes</li>
            </ul>

            <h3>4.3 We Never:</h3>
            <ul>
              <li>❌ Sell your personal data to third parties</li>
              <li>❌ Share your data for marketing purposes without consent</li>
              <li>❌ Transfer data outside the UK/EEA without adequate safeguards</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <p>We retain your data for:</p>
            <ul>
              <li><strong>KYC Documents:</strong> 5 years after account closure (legal requirement)</li>
              <li><strong>Transaction Records:</strong> 5 years (legal requirement)</li>
              <li><strong>Account Information:</strong> Until account closure + 5 years</li>
              <li><strong>Marketing Data:</strong> Until you unsubscribe</li>
              <li><strong>Technical Logs:</strong> 90 days</li>
            </ul>
          </section>

          <section>
            <h2>6. Your Rights (UK GDPR)</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion (subject to legal retention requirements)</li>
              <li><strong>Restriction:</strong> Limit how we use your data</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Opt out of marketing at any time</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at: <a href="mailto:privacy@bitcurrent.co.uk" className="text-primary hover:underline">privacy@bitcurrent.co.uk</a>
            </p>
            <p>
              <strong>Note:</strong> Some rights may be limited by legal obligations (e.g., we cannot delete data we're 
              legally required to retain for AML purposes).
            </p>
          </section>

          <section>
            <h2>7. Data Security</h2>
            <p>We protect your data using:</p>
            <ul>
              <li>TLS/SSL encryption for all data transmission</li>
              <li>bcrypt password hashing (10 rounds)</li>
              <li>Encrypted database storage</li>
              <li>Access controls and authentication</li>
              <li>Regular security audits</li>
              <li>Intrusion detection systems</li>
            </ul>
            <p>
              <strong>Data Breaches:</strong> In the event of a data breach affecting your rights, we will notify you 
              and the Information Commissioner's Office (ICO) within 72 hours.
            </p>
          </section>

          <section>
            <h2>8. International Transfers</h2>
            <p>
              Your data is primarily stored in the UK/EU. However, some service providers (e.g., Alpaca Markets) are 
              based in the United States. Data transfers to the US are protected by:
            </p>
            <ul>
              <li>Standard Contractual Clauses (SCCs) approved by the EU Commission</li>
              <li>Service providers' data protection certifications</li>
              <li>Contractual obligations to maintain UK GDPR-equivalent protections</li>
            </ul>
          </section>

          <section>
            <h2>9. Cookies</h2>
            <p>
              We use cookies to provide essential functionality and analytics. For full details, see our 
              <a href="/legal/cookies" className="text-primary hover:underline"> Cookie Policy</a>.
            </p>
            <p><strong>Essential Cookies:</strong> Required for login, security (cannot be disabled)</p>
            <p><strong>Analytics Cookies:</strong> Help us improve the platform (can be disabled)</p>
            <p><strong>Your Control:</strong> Manage cookie preferences in your browser settings</p>
          </section>

          <section>
            <h2>10. Children's Privacy</h2>
            <p>
              Our services are NOT intended for anyone under 18 years old. We do not knowingly collect information 
              from children. If we discover we have collected data from a minor, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via email 
              or platform notification at least 30 days before they take effect.
            </p>
            <p>
              <strong>Last Updated:</strong> October 11, 2025<br />
              <strong>Version:</strong> 1.0
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights:</p>
            <p>
              <strong>Email:</strong> <a href="mailto:privacy@bitcurrent.co.uk" className="text-primary hover:underline">privacy@bitcurrent.co.uk</a><br />
              <strong>Data Protection Officer:</strong> Ayaan Sharif<br />
              <strong>Address:</strong> [To be added upon company registration]
            </p>
          </section>

          <div className="mt-12 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="font-semibold mb-2">Your Rights Matter</p>
            <p className="text-sm">
              We take your privacy seriously. If you have any concerns about how we handle your data, please don't 
              hesitate to contact us. You also have the right to lodge a complaint with the Information Commissioner's 
              Office (ICO): <a href="https://ico.org.uk" target="_blank" rel="noopener" className="text-primary hover:underline">www.ico.org.uk</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
