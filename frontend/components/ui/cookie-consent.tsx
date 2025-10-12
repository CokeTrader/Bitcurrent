"use client"

import { useState, useEffect } from "react"
import { Card } from "./card"
import { Button } from "./button"
import { Cookie } from "lucide-react"
import Link from "next/link"

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setIsVisible(false)
    
    // Enable analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t">
      <div className="container mx-auto max-w-6xl">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <Cookie className="h-8 w-8 text-primary flex-shrink-0" />
            
            <div className="flex-1">
              <h3 className="font-semibold mb-1">We use cookies</h3>
              <p className="text-sm text-muted-foreground">
                We use essential cookies to make our site work. With your consent, we may also use analytics cookies to improve user experience.{' '}
                <Link href="/legal/privacy" className="underline hover:text-foreground">
                  Learn more
                </Link>
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDecline}>
                Decline
              </Button>
              <Button onClick={handleAccept}>
                Accept
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

