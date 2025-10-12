"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Lock,
  Bell,
  Shield,
  Trash2,
  AlertTriangle,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("")

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    // Call API to delete account
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8080/api/v1/account/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success("Account deleted successfully")
        // Clear session
        document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        localStorage.clear()
        router.push('/auth/login')
      } else {
        toast.error("Failed to delete account")
      }
    } catch (error) {
      toast.error("Error deleting account")
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
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="paper-trading">
                <TrendingUp className="h-4 w-4 mr-2" />
                Paper Trading
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="danger">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Danger Zone
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input placeholder="John" />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input placeholder="Doe" />
                    </div>
                  </div>

                  <div>
                    <Label>Email Address</Label>
                    <Input type="email" placeholder="john@example.com" disabled />
                    <p className="text-sm text-muted-foreground mt-1">
                      Email cannot be changed for security reasons
                    </p>
                  </div>

                  <div>
                    <Label>Phone Number</Label>
                    <Input type="tel" placeholder="+44 7700 900000" />
                  </div>

                  <Button>Save Changes</Button>
                </div>
              </Card>
            </TabsContent>

            {/* Paper Trading Settings */}
            <TabsContent value="paper-trading" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Paper Trading</h2>
                <p className="text-muted-foreground mb-6">
                  Practice trading with virtual funds. No risk, real market conditions.
                </p>
                
                <div className="space-y-6">
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <h3 className="font-semibold text-primary mb-2">About Paper Trading</h3>
                    <p className="text-sm text-muted-foreground">
                      Create up to 2 paper trading accounts with balances between £100 and £100,000. 
                      Practice your trading strategies with real-time market data without risking real money.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => router.push('/settings/paper-trading')} className="flex-1">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Manage Paper Accounts
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  {/* Change Password */}
                  <div>
                    <h3 className="font-semibold mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Current Password</Label>
                        <Input type="password" />
                      </div>
                      <div>
                        <Label>New Password</Label>
                        <Input type="password" />
                      </div>
                      <div>
                        <Label>Confirm New Password</Label>
                        <Input type="password" />
                      </div>
                      <Button>Update Password</Button>
                    </div>
                  </div>

                  {/* 2FA */}
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/settings/2fa')}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Manage 2FA
                    </Button>
                  </div>

                  {/* Active Sessions */}
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold mb-4">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage devices that are currently logged in to your account
                    </p>
                    <Button variant="outline">View Active Sessions</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Trade Notifications</p>
                      <p className="text-sm text-muted-foreground">Get notified when your orders are filled</p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Price Alerts</p>
                      <p className="text-sm text-muted-foreground">Receive alerts when prices reach certain levels</p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Security Alerts</p>
                      <p className="text-sm text-muted-foreground">Important security notifications</p>
                    </div>
                    <Button variant="outline">Enabled</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Danger Zone */}
            <TabsContent value="danger" className="space-y-6">
              <Card className="p-6 border-destructive">
                <h2 className="text-2xl font-semibold mb-6 text-destructive">Danger Zone</h2>
                
                <div className="space-y-6">
                  {/* Delete Account */}
                  <div>
                    <h3 className="font-semibold mb-2">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your BitCurrent account. This action cannot be undone.
                    </p>

                    {!showDeleteConfirm ? (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete My Account
                      </Button>
                    ) : (
                      <Card className="p-4 bg-destructive/10 border-destructive">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="space-y-2 text-sm">
                              <p className="font-semibold text-destructive">Are you absolutely sure?</p>
                              <p className="text-muted-foreground">
                                This will permanently delete your account, including:
                              </p>
                              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>All your personal information</li>
                                <li>Trading history and records</li>
                                <li>Portfolio data</li>
                                <li>Saved preferences</li>
                              </ul>
                              <p className="text-destructive font-semibold mt-4">
                                Make sure you have withdrawn all your funds first!
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label>Type DELETE to confirm</Label>
                            <Input
                              placeholder="DELETE"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="font-mono"
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowDeleteConfirm(false)
                                setDeleteConfirmText("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmText !== "DELETE"}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Permanently Delete Account
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Export Data */}
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold mb-2">Export Your Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download a copy of your account data and trading history
                    </p>
                    <Button variant="outline">
                      Export Data
                    </Button>
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
