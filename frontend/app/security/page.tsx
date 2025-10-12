"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Shield, Smartphone, Monitor, MapPin, Clock, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export default function SecurityPage() {
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [qrCode, setQRCode] = useState("")

  const sessions = [
    {
      id: "session_1",
      device: "Chrome on macOS",
      location: "London, UK",
      ip: "81.xxx.xxx.123",
      current: true,
      lastActive: "Now"
    },
    {
      id: "session_2",
      device: "Safari on iPhone",
      location: "London, UK",
      ip: "81.xxx.xxx.124",
      current: false,
      lastActive: "2 hours ago"
    }
  ]

  const securityEvents = [
    {
      type: "Login",
      device: "Chrome on macOS",
      location: "London, UK",
      time: "Just now",
      success: true
    },
    {
      type: "Password Changed",
      device: "Chrome on macOS",
      location: "London, UK",
      time: "2 days ago",
      success: true
    }
  ]

  const enable2FA = async () => {
    // TODO: Call API
    setQRCode("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
    setShow2FASetup(true)
  }

  const verify2FA = async () => {
    // TODO: Call API
    toast.success("2FA enabled successfully!")
    setShow2FASetup(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Security Settings</h1>
            <p className="text-muted-foreground">
              Manage your account security and active sessions
            </p>
          </div>

          {/* 2FA Section */}
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add an extra layer of security to your account
                  </p>
                  <Badge variant="outline">Not Enabled</Badge>
                </div>
              </div>
              <Button onClick={enable2FA}>Enable 2FA</Button>
            </div>

            {show2FASetup && (
              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="text-center">
                  <p className="font-semibold mb-4">Scan this QR code with your authenticator app:</p>
                  {qrCode && (
                    <div className="inline-block p-4 bg-white rounded-lg">
                      <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                        QR Code Here
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Enter 6-digit code from app:
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    <Button onClick={verify2FA} disabled={verificationCode.length !== 6}>
                      Verify
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Active Sessions */}
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Active Sessions</h3>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-4 rounded-lg border">
                  <Monitor className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{session.device}</span>
                      {session.current && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </div>
                      <div>{session.ip}</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.lastActive}
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Security Activity */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Recent Security Activity</h3>
            <div className="space-y-3">
              {securityEvents.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <div className="font-semibold">{event.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.device} • {event.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{event.time}</div>
                    {event.success && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        Success
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
