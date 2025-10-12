"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { motion } from "framer-motion"

interface PaperAccount {
  id: string
  name: string
  initialBalance: number
  currentBalance: number
  isActive: boolean
  createdAt: string
}

export default function PaperTradingSettingsPage() {
  const [paperMode, setPaperMode] = React.useState(false)
  const [accounts, setAccounts] = React.useState<PaperAccount[]>([])
  const [loading, setLoading] = React.useState(false)
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [newAccountName, setNewAccountName] = React.useState("")
  const [newAccountBalance, setNewAccountBalance] = React.useState("10000")

  // Load accounts on mount
  React.useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/paper-trading/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.success) {
        setAccounts(data.accounts)
        // If user has active accounts, enable paper mode
        setPaperMode(data.accounts.some((a: PaperAccount) => a.isActive))
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    }
  }

  const createAccount = async () => {
    const balance = parseFloat(newAccountBalance)
    
    if (isNaN(balance) || balance < 100 || balance > 100000) {
      toast.error("Invalid Balance", {
        description: "Balance must be between £100 and £100,000"
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/paper-trading/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newAccountName || undefined,
          initialBalance: balance
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Account Created!", {
          description: `Paper trading account with £${balance.toLocaleString()} created`
        })
        setNewAccountName("")
        setNewAccountBalance("10000")
        setShowCreateForm(false)
        fetchAccounts()
      } else {
        toast.error("Failed to Create Account", {
          description: data.error
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to create paper trading account"
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/paper-trading/accounts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Account Deleted", {
          description: `"${name}" has been deleted`
        })
        fetchAccounts()
      } else {
        toast.error("Failed to Delete", {
          description: data.error
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to delete account"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetAccount = async (id: string, name: string) => {
    if (!confirm(`Reset "${name}" to initial balance? All trading history will be kept for reference.`)) {
      return
    }

    setLoading(false)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/paper-trading/accounts/${id}/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Account Reset", {
          description: `"${name}" has been reset`
        })
        fetchAccounts()
      } else {
        toast.error("Failed to Reset", {
          description: data.error
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to reset account"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Paper Trading</h1>
        <p className="text-muted-foreground">
          Practice trading with virtual funds. No risk, real market conditions.
        </p>
      </div>

      {/* Paper Mode Toggle */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Paper Trading Mode</h3>
            <p className="text-sm text-muted-foreground">
              Use virtual funds to practice trading without risking real money
            </p>
          </div>
          <Switch
            checked={paperMode}
            onCheckedChange={(checked) => {
              if (!checked && accounts.length > 0) {
                toast.error("Cannot Disable", {
                  description: "Delete all paper accounts first"
                })
                return
              }
              setPaperMode(checked)
              localStorage.setItem('paperTradingMode', checked ? 'true' : 'false')
            }}
          />
        </div>
      </Card>

      {/* Account List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Paper Trading Accounts</h2>
          {accounts.length < 2 && (
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-primary mb-1">About Paper Trading</p>
            <p className="text-muted-foreground">
              Create up to 2 paper trading accounts with balances between £100 and £100,000. 
              Practice your trading strategies with real-time market data without risking real money.
            </p>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 mb-6 border-primary/50">
              <h3 className="text-lg font-semibold mb-4">Create New Paper Account</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="account-name">Account Name (Optional)</Label>
                  <Input
                    id="account-name"
                    placeholder="e.g., Conservative Strategy"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="initial-balance">Initial Balance (£)</Label>
                  <Input
                    id="initial-balance"
                    type="number"
                    min="100"
                    max="100000"
                    step="100"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: £100 | Max: £100,000
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={createAccount} loading={loading} className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <Card className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Paper Trading Accounts</h3>
            <p className="text-muted-foreground mb-4">
              Create your first paper trading account to start practicing
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Account
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Initial Balance</p>
                      <p className="text-2xl font-bold">
                        £{account.initialBalance.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                      <p className="text-2xl font-bold">
                        £{account.currentBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Profit/Loss */}
                  {account.currentBalance !== account.initialBalance && (
                    <div className="mb-4 p-3 rounded-lg bg-muted">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">P&L:</span>
                        <span className={`text-lg font-bold ${
                          account.currentBalance > account.initialBalance
                            ? 'text-success'
                            : 'text-destructive'
                        }`}>
                          {account.currentBalance > account.initialBalance ? '+' : ''}
                          £{(account.currentBalance - account.initialBalance).toLocaleString()}
                          {' '}
                          ({(((account.currentBalance - account.initialBalance) / account.initialBalance) * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetAccount(account.id, account.name)}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAccount(account.id, account.name)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Account Limit Info */}
        {accounts.length >= 2 && (
          <div className="mt-4 p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              <strong>Maximum accounts reached.</strong> You can have up to 2 active paper trading accounts. 
              Delete one to create a new account.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

