"use client"

import { useEffect } from 'react'
import { trackConversion, trackEvent } from './google-analytics'

export function TrackSignup({ email }: { email: string }) {
  useEffect(() => {
    trackConversion('signup')
    trackEvent('user_registered', 'engagement', email)
    
    // Facebook Pixel (if configured)
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'CompleteRegistration')
    }
  }, [email])

  return null
}

export function TrackDeposit({ amount }: { amount: number }) {
  useEffect(() => {
    trackConversion('deposit', amount)
    trackEvent('deposit_completed', 'revenue', undefined, amount)
    
    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', { value: amount, currency: 'GBP' })
    }
  }, [amount])

  return null
}

export function TrackTrade({ symbol, amount, side }: { symbol: string, amount: number, side: 'buy' | 'sell' }) {
  useEffect(() => {
    trackConversion('trade', amount)
    trackEvent(`trade_${side}`, 'trading', symbol, amount)
    
    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', { value: amount, currency: 'GBP' })
    }
  }, [symbol, amount, side])

  return null
}

export function TrackButtonClick({ label, category }: { label: string, category?: string }) {
  return {
    onClick: () => trackEvent('button_click', category || 'engagement', label)
  }
}


