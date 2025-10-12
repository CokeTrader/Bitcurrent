'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface TwoFAStatus {
  enabled: boolean
  qrCodeUrl?: string
  secret?: string
}

export default function TwoFactorAuthPage() {
  const router = useRouter()
  const [status, setStatus] = useState<TwoFAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/v1/2fa/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      } else if (response.status === 401) {
        router.push('/auth/login')
      }
    } catch (err) {
      setError('Failed to fetch 2FA status')
    } finally {
      setLoading(false)
    }
  }

  const setupTwoFA = async () => {
    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatus({
          enabled: false,
          qrCodeUrl: data.qrCodeUrl,
          secret: data.secret
        })
        setSuccess('Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to setup 2FA')
      }
    } catch (err) {
      setError('Failed to setup 2FA')
    } finally {
      setActionLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: verificationCode })
      })

      if (response.ok) {
        setSuccess('2FA enabled successfully!')
        setVerificationCode('')
        setTimeout(() => {
          fetchStatus()
        }, 1500)
      } else {
        const data = await response.json()
        setError(data.message || 'Invalid verification code')
      }
    } catch (err) {
      setError('Failed to verify code')
    } finally {
      setActionLoading(false)
    }
  }

  const disableTwoFA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('2FA disabled successfully')
        setTimeout(() => {
          fetchStatus()
        }, 1500)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to disable 2FA')
      }
    } catch (err) {
      setError('Failed to disable 2FA')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Two-Factor Authentication</h1>
        <p className="text-muted-foreground">
          Add an extra layer of security to your account
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50 text-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {status?.enabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              2FA is Enabled
            </CardTitle>
            <CardDescription>
              Your account is protected with two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You'll need to enter a code from your authenticator app every time you log in.
            </p>
            <Button
              variant="destructive"
              onClick={disableTwoFA}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </Button>
          </CardContent>
        </Card>
      ) : status?.qrCodeUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Complete 2FA Setup</CardTitle>
            <CardDescription>
              Scan the QR code below with your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <Image
                  src={status.qrCodeUrl}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="w-48 h-48"
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Or enter this code manually:
                </p>
                <code className="bg-muted px-3 py-1 rounded text-sm font-mono">
                  {status.secret}
                </code>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="verification-code">
                  Enter 6-digit code from your app
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={verifyAndEnable}
                  disabled={actionLoading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify and Enable
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStatus({ enabled: false })}
                >
                  Cancel
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Important:</strong> Save your recovery codes in a safe place. 
                You'll need them if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Enable Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Protect your account with an additional security layer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code we'll provide</li>
                <li>Enter the 6-digit code from your app</li>
                <li>You're all set! You'll use this code when logging in</li>
              </ol>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                We recommend enabling 2FA to keep your funds and personal information secure.
              </AlertDescription>
            </Alert>

            <Button
              onClick={setupTwoFA}
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable 2FA
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/settings')}
        >
          ← Back to Settings
        </Button>
      </div>
    </div>
  )
}


