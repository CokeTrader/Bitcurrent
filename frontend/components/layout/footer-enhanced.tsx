"use client"

import Link from "next/link"
import { Badge } from "../ui/badge"
import { Shield, Lock, Zap } from "lucide-react"

export function FooterEnhanced() {
  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Trust Badges */}
        <div className="flex justify-center gap-6 mb-8 pb-8 border-b">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="font-medium">Bank-Grade Security</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Cold Storage</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-600" />
            <span className="font-medium">Instant GBP Deposits</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/trade/BTC-GBP" className="hover:text-foreground">Buy Bitcoin</Link></li>
              <li><Link href="/trade/ETH-GBP" className="hover:text-foreground">Buy Ethereum</Link></li>
              <li><Link href="/markets" className="hover:text-foreground">All Markets</Link></li>
              <li><Link href="/fees" className="hover:text-foreground">Fees (0.25%)</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/legal/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/legal/disclaimer" className="hover:text-foreground">Risk Disclaimer</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/faq" className="hover:text-foreground">Help Center</Link></li>
              <li className="text-sm">Email: support@bitcurrent.co.uk</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center text-sm text-muted-foreground border-t pt-8">
          <p className="mb-2">
            BitCurrent is a UK-based cryptocurrency broker. Trading cryptocurrencies carries risk.
          </p>
          <p>
            © {new Date().getFullYear()} BitCurrent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}


