"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Bitcoin,
  Wallet,
  Copy,
  Check,
  AlertCircle,
  CreditCard,
  Building2,
  QrCode,
  ArrowDown,
  Clock,
  Info
} from "lucide-react"
import { toast } from "sonner"

export default function DepositPage() {
  const [copied, setCopied] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [selectedMethod, setSelectedMethod] = React.useState("crypto")

  // Demo wallet addresses
  const walletAddresses = {
    BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    ETH: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    SOL: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
  }

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success("Address copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBankDeposit = () => {
    toast.success("Bank deposit instructions sent", {
      description: "Check your email for bank transfer details"
    })
  }

  const handleCardDeposit = async () => {
    // Redirect to Stripe Checkout
    try {
      const response = await fetch('https://bitcurrent-production.up.railway.app/api/v1/deposits/stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })
      
      const data = await response.json()
      
      if (data.success && data.url) {
        // Redirect to Stripe
        window.location.href = data.url
      } else {
        toast.error("Deposit failed", {
          description: data.error || "Please try again"
        })
      }
    } catch (error) {
      toast.error("Connection error", {
        description: "Please check your internet connection"
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Deposit Funds</h1>
            <p className="text-muted-foreground">
              Add funds to your BitCurrent account to start trading
            </p>
          </div>

          {/* Deposit Methods */}
          <Tabs defaultValue="crypto" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="crypto">
                <Bitcoin className="h-4 w-4 mr-2" />
                Cryptocurrency
              </TabsTrigger>
              <TabsTrigger value="bank">
                <Building2 className="h-4 w-4 mr-2" />
                Bank Transfer
              </TabsTrigger>
              <TabsTrigger value="card">
                <CreditCard className="h-4 w-4 mr-2" />
                Instant Deposit (Stripe)
              </TabsTrigger>
            </TabsList>

            {/* Crypto Deposit */}
            <TabsContent value="crypto" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Cryptocurrency Deposit</h2>
                
                <div className="space-y-6">
                  {/* Bitcoin */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                          <Bitcoin className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">Bitcoin (BTC)</p>
                          <p className="text-sm text-muted-foreground">Network: Bitcoin</p>
                        </div>
                      </div>
                      <Badge>No Fees</Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Deposit Address</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={walletAddresses.BTC}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(walletAddresses.BTC)}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Minimum deposit: 0.0001 BTC • Confirmations required: 3
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ethereum */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">Ethereum (ETH)</p>
                          <p className="text-sm text-muted-foreground">Network: ERC-20</p>
                        </div>
                      </div>
                      <Badge>No Fees</Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Deposit Address</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={walletAddresses.ETH}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(walletAddresses.ETH)}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Minimum deposit: 0.01 ETH • Confirmations required: 12
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Solana */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold">S</span>
                        </div>
                        <div>
                          <p className="font-semibold">Solana (SOL)</p>
                          <p className="text-sm text-muted-foreground">Network: Solana</p>
                        </div>
                      </div>
                      <Badge>No Fees</Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Deposit Address</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={walletAddresses.SOL}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(walletAddresses.SOL)}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Minimum deposit: 0.1 SOL • Confirmations required: 1
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Warning Card */}
              <Card className="p-6 bg-orange-500/10 border-orange-500/20">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">Important:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Only send the correct cryptocurrency to its respective address</li>
                      <li>• Sending the wrong crypto will result in permanent loss of funds</li>
                      <li>• Wait for confirmations before funds appear in your account</li>
                      <li>• Save this address for future deposits</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Bank Transfer */}
            <TabsContent value="bank" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Bank Transfer (GBP)</h2>
                
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Bank Name</p>
                        <p className="font-semibold">Modulr Finance</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Account Name</p>
                        <p className="font-semibold">BitCurrent Ltd</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Sort Code</p>
                        <p className="font-semibold font-mono">04-00-75</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                        <p className="font-semibold font-mono">12345678</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Reference (Important!)</p>
                        <div className="flex gap-2">
                          <Input
                            value="BC123456"
                            readOnly
                            className="font-mono font-semibold"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy("BC123456")}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Processing time: 1-3 business days</span>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">No fees for bank transfers</span>
                    </div>
                  </div>

                  <Button onClick={handleBankDeposit} className="w-full">
                    Send Instructions to Email
                  </Button>
                </div>
              </Card>

              <Card className="p-6 bg-muted/50">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">Bank Transfer Notes:</p>
                    <ul className="space-y-1">
                      <li>• You must use the reference code provided</li>
                      <li>• Transfers typically arrive within 1-3 business days</li>
                      <li>• Minimum deposit: £10</li>
                      <li>• Level 1 KYC verification required</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Card Deposit */}
            <TabsContent value="card" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Debit/Credit Card Deposit</h2>
                
                <div className="space-y-6">
                  <div>
                    <Label>Amount (GBP)</Label>
                    <Input
                      type="number"
                      placeholder="100.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-xl font-semibold"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Min: £10 • Max: £5,000
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit amount</span>
                      <span className="font-semibold">£{amount || "0.00"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing fee (2.9%)</span>
                      <span className="font-semibold">£{amount ? (parseFloat(amount) * 0.029).toFixed(2) : "0.00"}</span>
                    </div>
                    <div className="pt-3 border-t flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-lg">£{amount ? (parseFloat(amount) * 1.029).toFixed(2) : "0.00"}</span>
                    </div>
                  </div>

                  <Button onClick={handleCardDeposit} className="w-full" disabled={!amount}>
                    Continue to Payment
                  </Button>

                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Card deposits require Level 1 KYC verification</span>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}

