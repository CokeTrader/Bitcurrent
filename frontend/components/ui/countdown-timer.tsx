"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

export function CountdownTimer({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const end = endDate.getTime()
      const distance = end - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  return (
    <div className="inline-flex items-center gap-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg px-6 py-3">
      <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
      <div className="flex gap-3 font-mono font-bold">
        {timeLeft.days > 0 && (
          <div>
            <div className="text-2xl">{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        )}
        <div>
          <div className="text-2xl">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">hrs</div>
        </div>
        <div>
          <div className="text-2xl">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">min</div>
        </div>
        <div>
          <div className="text-2xl">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">sec</div>
        </div>
      </div>
    </div>
  )
}


