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
  AlertCircle,
  Building2,
  ArrowUp,
  Clock,
  Info,
  Shield
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function WithdrawPage() {
  const router = useRouter()
  const [cryptoAmount, setCryptoAmount] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [fiatAmount, setFiatAmount] = React.useState("")
  const [selectedCrypto, setSelectedCrypto] = React.useState("BTC")

  // Mock balances - would come from API in production
  const balances = {
    GBP: 0.00,
    BTC: 0.00000000,
    ETH: 0.00000000,
    SOL: 0.00000000
  }

  const handleCryptoWithdraw = () => {
    if (!cryptoAmount || !address) {
      toast.error("Please fill in all fields")
      return
    }

    if (balances[selectedCrypto as keyof typeof balances] === 0) {
      toast.error("Insufficient balance", {
        description: "You need to deposit funds first"
      })
      return
    }

    toast.success("Withdrawal request submitted", {
      description: "Your withdrawal will be processed within 24 hours"
    })
  }

  const handleFiatWithdraw = () => {
    if (!fiatAmount) {
      toast.error("Please enter an amount")
      return
    }

    if (balances.GBP === 0) {
      toast.error("Insufficient balance", {
        description: "You need to deposit funds first"
      })
      return
    }

    toast.info("KYC verification required", {
      description: "Please complete Level 1 KYC to withdraw fiat",
      action: {
        label: "Verify Now",
        onClick: () => router.push("/kyc")
      }
    })
  }

  const cryptoWithdrawalFees = {
    BTC: { fee: "0.0005 BTC", min: "0.001 BTC" },
    ETH: { fee: "0.005 ETH", min: "0.01 ETH" },
    SOL: { fee: "0.01 SOL", min: "0.1 SOL" }
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
            <h1 className="text-4xl font-bold mb-2">Withdraw Funds</h1>
            <p className="text-muted-foreground">
              Withdraw your cryptocurrency or fiat currency
            </p>
          </div>

          {/* Balances Card */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-success/5">
            <h3 className="font-semibold mb-4">Available Balances</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">GBP</p>
                <p className="text-xl font-bold">£{balances.GBP.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bitcoin</p>
                <p className="text-xl font-bold">{balances.BTC.toFixed(8)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ethereum</p>
                <p className="text-xl font-bold">{balances.ETH.toFixed(8)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solana</p>
                <p className="text-xl font-bold">{balances.SOL.toFixed(8)}</p>
              </div>
            </div>
          </Card>

          {/* Withdrawal Methods */}
          <Tabs defaultValue="crypto" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="crypto">
                <Bitcoin className="h-4 w-4 mr-2" />
                Cryptocurrency
              </TabsTrigger>
              <TabsTrigger value="fiat">
                <Building2 className="h-4 w-4 mr-2" />
                Bank Transfer (GBP)
              </TabsTrigger>
            </TabsList>

            {/* Crypto Withdrawal */}
            <TabsContent value="crypto" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Cryptocurrency Withdrawal</h2>
                
                <div className="space-y-6">
                  {/* Select Currency */}
                  <div>
                    <Label>Select Currency</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {Object.keys(cryptoWithdrawalFees).map((crypto) => (
                        <Card
                          key={crypto}
                          className={`p-4 cursor-pointer transition-all ${
                            selectedCrypto === crypto
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedCrypto(crypto)}
                        >
                          <div className="flex items-center gap-2">
                            {crypto === "BTC" && <Bitcoin className="h-5 w-5" />}
                            {crypto === "ETH" && <Wallet className="h-5 w-5" />}
                            {crypto === "SOL" && <div className="h-5 w-5 rounded-full bg-purple-500" />}
                            <div>
                              <p className="font-semibold">{crypto}</p>
                              <p className="text-xs text-muted-foreground">
                                {balances[crypto as keyof typeof balances].toFixed(8)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Withdrawal Address */}
                  <div>
                    <Label>Withdrawal Address</Label>
                    <Input
                      placeholder={`Enter ${selectedCrypto} address`}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Make sure this is a valid {selectedCrypto} address
                    </p>
                  </div>

                  {/* Amount */}
                  <div>
                    <Label>Amount</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.00000001"
                        placeholder="0.00000000"
                        value={cryptoAmount}
                        onChange={(e) => setCryptoAmount(e.target.value)}
                        className="text-xl font-semibold"
                      />
                      <Button variant="outline" onClick={() => setCryptoAmount(balances[selectedCrypto as keyof typeof balances].toString())}>
                        Max
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Min: {cryptoWithdrawalFees[selectedCrypto as keyof typeof cryptoWithdrawalFees].min} • 
                      Fee: {cryptoWithdrawalFees[selectedCrypto as keyof typeof cryptoWithdrawalFees].fee}
                    </p>
                  </div>

                  {/* Fee Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold">{cryptoAmount || "0.00000000"} {selectedCrypto}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Network Fee</span>
                      <span className="font-semibold">{cryptoWithdrawalFees[selectedCrypto as keyof typeof cryptoWithdrawalFees].fee}</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between">
                      <span className="font-semibold">You'll receive</span>
                      <span className="font-bold text-lg">
                        {cryptoAmount ? 
                          (parseFloat(cryptoAmount) - parseFloat(cryptoWithdrawalFees[selectedCrypto as keyof typeof cryptoWithdrawalFees].fee)).toFixed(8) 
                          : "0.00000000"} {selectedCrypto}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Withdrawals are processed within 24 hours. Please double-check your address.</span>
                  </div>

                  <Button onClick={handleCryptoWithdraw} className="w-full" size="lg">
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Withdraw {selectedCrypto}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Fiat Withdrawal */}
            <TabsContent value="fiat" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Bank Transfer (GBP)</h2>
                
                <div className="space-y-6">
                  {/* KYC Requirement */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">KYC Level 1 Required</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Complete identity verification to withdraw fiat currency
                        </p>
                        <Button 
                          size="sm" 
                          className="mt-3"
                          onClick={() => router.push("/kyc")}
                        >
                          Complete KYC Verification
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div>
                    <Label>Bank Account</Label>
                    <Card className="p-4 mt-2 bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">No bank account linked</p>
                      <p className="text-xs text-muted-foreground">
                        Add your bank details in Settings after completing KYC
                      </p>
                    </Card>
                  </div>

                  {/* Amount */}
                  <div>
                    <Label>Amount (GBP)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="100.00"
                      value={fiatAmount}
                      onChange={(e) => setFiatAmount(e.target.value)}
                      className="text-xl font-semibold"
                      disabled
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Min: £10 • No fees for bank transfers
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Processing time: 1-3 business days</span>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Info className="h-4 w-4 text-green-500" />
                      <span className="text-sm">No fees for bank transfers</span>
                    </div>
                  </div>

                  <Button onClick={handleFiatWithdraw} className="w-full" size="lg" disabled>
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Withdraw to Bank
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Important Info */}
          <Card className="p-6 bg-muted/50">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Important Withdrawal Information:</p>
                <ul className="space-y-1">
                  <li>• Cryptocurrency withdrawals are processed within 24 hours</li>
                  <li>• Bank transfers take 1-3 business days</li>
                  <li>• Minimum withdrawal amounts apply to all currencies</li>
                  <li>• Double-check addresses - transactions cannot be reversed</li>
                  <li>• Level 1 KYC required for fiat withdrawals</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

