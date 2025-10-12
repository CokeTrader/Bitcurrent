"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageLoader } from '@/components/loading/PageLoader'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const refresh = searchParams.get('refresh')

    if (token) {
      // Store tokens
      localStorage.setItem('token', token)
      if (refresh) {
        localStorage.setItem('refresh_token', refresh)
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } else {
      // OAuth failed, redirect to login with error
      router.push('/auth/login?error=Authentication failed')
    }
  }, [searchParams, router])

  return <PageLoader message="Completing sign in..." />
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading..." />}>
      <CallbackContent />
    </Suspense>
  )
}

