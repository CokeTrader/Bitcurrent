import Link from "next/link"
import { Shield, Lock, Award } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">BitCurrent</h3>
            <p className="text-sm text-muted-foreground">
              The UK's premier cryptocurrency exchange. Trade with confidence.
            </p>
            {/* Security Badges */}
            <div className="flex gap-3 pt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-buy" aria-hidden="true" />
                <span>Bank-Grade Security</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-4 w-4 text-buy" aria-hidden="true" />
              <span>95% Cold Storage</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Award className="h-4 w-4 text-warning" aria-hidden="true" />
              <span>FCA Application Pending</span>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Products</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/markets" className="text-muted-foreground hover:text-foreground transition-colors">
                  Markets
                </Link>
              </li>
              <li>
                <Link href="/trade/BTC-GBP" className="text-muted-foreground hover:text-foreground transition-colors">
                  Spot Trading
                </Link>
              </li>
              <li>
                <Link href="/fees" className="text-muted-foreground hover:text-foreground transition-colors">
                  Fees
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Portfolio
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/help#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:support@bitcurrent.co.uk" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="/account/verification" className="text-muted-foreground hover:text-foreground transition-colors">
                  Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/aml" className="text-muted-foreground hover:text-foreground transition-colors">
                  AML Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 BitCurrent Exchange Ltd. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Cryptocurrency trading involves risk. FCA application pending. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  )
}



