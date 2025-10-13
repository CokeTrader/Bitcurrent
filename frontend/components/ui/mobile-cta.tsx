"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "./button"
import { X } from "lucide-react"

export function MobileCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Show after 3 seconds, only on mobile
    const timer = setTimeout(() => {
      const isMobile = window.innerWidth < 768
      const hasDismissed = sessionStorage.getItem('mobileCTA-dismissed')
      
      if (isMobile && !hasDismissed) {
        setIsVisible(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
    sessionStorage.setItem('mobileCTA-dismissed', 'true')
  }

  if (!isVisible || isDismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-green-600 to-emerald-600 shadow-2xl md:hidden animate-in slide-in-from-bottom-full">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20"
      >
        <X className="h-4 w-4 text-white" />
      </button>
      
      <div className="text-center text-white mb-3">
        <p className="font-bold text-lg">Get £10 Free Bitcoin!</p>
        <p className="text-sm opacity-90">Sign up now - 67 spots left</p>
      </div>
      
      <Link href="/auth/register" className="block">
        <Button 
          size="lg" 
          variant="secondary" 
          className="w-full bg-white text-green-700 hover:bg-gray-100 font-bold"
        >
          Claim Your Bonus →
        </Button>
      </Link>
    </div>
  )
}


