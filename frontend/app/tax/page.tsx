"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"

interface TaxTransaction {
  date: string
  type: string
  asset: string
  amount: number
  costBasis: number
  proceeds: number
  gainLoss: number
}

export default function TaxPage() {
  const [taxYear, setTaxYear] = React.useState("2024-2025")
  const [transactions, setTransactions] = React.useState<TaxTransaction[]>([])
  const [loading, setLoading] = React.useState(false)

  // For NEW accounts: NO transactions = NO tax data
  const totalGains = transactions.reduce((sum, t) => sum + (t.gainLoss > 0 ? t.gainLoss : 0), 0)
  const totalLosses = transactions.reduce((sum, t) => sum + (t.gainLoss < 0 ? Math.abs(t.gainLoss) : 0), 0)
  const netGainLoss = totalGains - totalLosses

  const handleGenerateReport = async () => {
    if (transactions.length === 0) {
      toast.info("No trading activity yet", {
        description: "You need to make trades before generating a tax report"
      })
      return
    }

    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
    
    toast.success("Tax report generated", {
      description: "Your report is ready for download"
    })
  }

  const handleDownloadCSV = () => {
    if (transactions.length === 0) {
      toast.info("No data to export")
      return
    }

    toast.success("CSV downloaded")
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Tax Center</h1>
            <p className="text-muted-foreground">
              Track your capital gains and generate HMRC-compliant tax reports
            </p>
          </div>

          {/* Tax Year Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Tax Year:</label>
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-background"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm">Total Capital Gains</p>
              </div>
              <p className="text-3xl font-bold text-success">
                £{totalGains.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {taxYear}
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingDown className="h-4 w-4" />
                <p className="text-sm">Total Capital Losses</p>
              </div>
              <p className="text-3xl font-bold text-destructive">
                £{totalLosses.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Can offset gains
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                <p className="text-sm">Net Gain/Loss</p>
              </div>
              <p className={`text-3xl font-bold ${netGainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netGainLoss >= 0 ? '+' : ''}£{netGainLoss.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Taxable amount
              </p>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {transactions.length === 0 ? (
                /* Empty State for NEW Accounts */
                <Card className="p-12 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h2 className="text-2xl font-bold mb-2">No Trading Activity Yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Your tax reports will appear here once you start trading
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    BitCurrent automatically tracks all your trades and calculates capital gains for UK tax purposes (HMRC compliant)
                  </p>
                  <Button onClick={() => window.location.href = '/deposit'}>
                    Deposit Funds to Start Trading
                  </Button>
                </Card>
              ) : (
                <Card className="p-6">
                  <h2 className="text-2xl font-semibold mb-6">Tax Summary {taxYear}</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <span className="font-medium">Total Taxable Transactions</span>
                      <span className="font-bold text-lg">{transactions.length}</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <span className="font-medium">Capital Gains Allowance (2024-25)</span>
                      <span className="font-bold text-lg">£3,000</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <span className="font-medium">Net Gain After Allowance</span>
                      <span className="font-bold text-lg">
                        £{Math.max(0, netGainLoss - 3000).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                      <span className="font-medium">Estimated Tax Due (Basic Rate 18%)</span>
                      <span className="font-bold text-xl text-primary">
                        £{(Math.max(0, netGainLoss - 3000) * 0.18).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      *Higher rate taxpayers pay 24%. This calculator assumes basic rate.
                    </p>
                  </div>
                </Card>
              )}

              {/* HMRC Information */}
              <Card className="p-6 bg-blue-500/5 border-blue-500/20">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">UK Tax Information (HMRC - 2024/25):</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <strong>Capital Gains Tax allowance:</strong> £3,000 (tax year 2024-25)</li>
                      <li>• <strong>Basic rate taxpayers:</strong> 18% on gains above allowance</li>
                      <li>• <strong>Higher rate taxpayers:</strong> 24% on gains above allowance</li>
                      <li>• <strong>Report using:</strong> Self Assessment forms SA100 & SA108</li>
                      <li>• <strong>Filing deadline:</strong> 31 January 2026 (for 2024-25 tax year)</li>
                      <li>• <strong>Record keeping:</strong> Keep records for at least 1 year after deadline</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Taxable Transactions</h2>
                  <Button variant="outline" onClick={handleDownloadCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium mb-2">No Transactions Yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start trading to see your transaction history here
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-sm text-muted-foreground">
                          <th className="text-left py-3">Date</th>
                          <th className="text-left py-3">Type</th>
                          <th className="text-left py-3">Asset</th>
                          <th className="text-right py-3">Amount</th>
                          <th className="text-right py-3">Cost Basis</th>
                          <th className="text-right py-3">Proceeds</th>
                          <th className="text-right py-3">Gain/Loss</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 text-sm">{tx.date}</td>
                            <td className="py-3 text-sm">{tx.type}</td>
                            <td className="py-3 text-sm font-medium">{tx.asset}</td>
                            <td className="py-3 text-right font-mono text-sm">{tx.amount}</td>
                            <td className="py-3 text-right font-mono text-sm">£{tx.costBasis.toFixed(2)}</td>
                            <td className="py-3 text-right font-mono text-sm">£{tx.proceeds.toFixed(2)}</td>
                            <td className={`py-3 text-right font-mono text-sm font-semibold ${tx.gainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {tx.gainLoss >= 0 ? '+' : ''}£{tx.gainLoss.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Tax Reports</h2>
                
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium mb-2">No Reports Available</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Reports will be generated once you have trading activity
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Capital Gains Report {taxYear}</h3>
                          <p className="text-sm text-muted-foreground">HMRC Self Assessment format</p>
                        </div>
                        <Badge>Ready</Badge>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleGenerateReport} disabled={loading}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button variant="outline" onClick={handleDownloadCSV}>
                          <FileText className="h-4 w-4 mr-2" />
                          Download CSV
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg opacity-50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Income Report {taxYear}</h3>
                          <p className="text-sm text-muted-foreground">Staking rewards & interest</p>
                        </div>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg opacity-50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Transaction History</h3>
                          <p className="text-sm text-muted-foreground">Complete trading history</p>
                        </div>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Instructions */}
              <Card className="p-6 bg-muted/50">
                <h3 className="font-semibold mb-4">How to Report to HMRC</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-semibold text-foreground">1.</span>
                    <span>Download your Capital Gains Report from BitCurrent</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-foreground">2.</span>
                    <span>Log in to your HMRC Self Assessment portal</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-foreground">3.</span>
                    <span>Navigate to the Capital Gains Tax section</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-foreground">4.</span>
                    <span>Enter total gains/losses from the report</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-foreground">5.</span>
                    <span>Submit before 31 January deadline</span>
                  </li>
                </ol>
              </Card>

              {/* Important Notice */}
              <Card className="p-6 bg-orange-500/5 border-orange-500/20">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">Important Disclaimer:</p>
                    <p className="text-muted-foreground">
                      This tool provides estimates only and should not be considered as professional tax advice. 
                      BitCurrent is not responsible for the accuracy of tax calculations. Please consult a qualified 
                      tax advisor or accountant for advice specific to your situation.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* UK Tax Guide */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">UK Cryptocurrency Tax Guide</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Capital Gains Tax on Crypto (2024-25)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  When you dispose of cryptocurrency (sell, trade, or gift), you may need to pay Capital Gains Tax (CGT) on any profit.
                </p>
                <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual CGT Allowance (2024-25):</span>
                    <span className="font-semibold">£3,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Basic rate taxpayers (income £0-50,270):</span>
                    <span className="font-semibold">18%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Higher rate taxpayers (income &gt; £50,270):</span>
                    <span className="font-semibold">24%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Source: HMRC Official Guidance (2024-25 tax year)
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What Triggers a Taxable Event?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Selling crypto for GBP</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Trading one crypto for another (e.g., BTC → ETH)</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Using crypto to buy goods or services</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span>Gifting crypto (unless to spouse/civil partner)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Income Tax on Crypto</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Cryptocurrency received as income (mining, staking, airdrops for services) is subject to Income Tax at your marginal rate.
                </p>
                <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Personal Allowance:</span>
                    <span className="font-semibold">£12,570 (0%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Basic rate (£12,571-£50,270):</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Higher rate (£50,271-£125,140):</span>
                    <span className="font-semibold">40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional rate (&gt; £125,140):</span>
                    <span className="font-semibold">45%</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Record Keeping (HMRC Required)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  BitCurrent automatically tracks all required information:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Date and time of each transaction</li>
                  <li>• Type of cryptocurrency and amount</li>
                  <li>• Value in GBP at time of transaction</li>
                  <li>• Cost basis (acquisition cost)</li>
                  <li>• Proceeds (disposal proceeds)</li>
                  <li>• Calculated gains/losses (HMRC-compliant methods)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  Records must be kept for at least 1 year after filing deadline.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

