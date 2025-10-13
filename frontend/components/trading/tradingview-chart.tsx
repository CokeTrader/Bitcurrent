"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"

interface TradingViewChartProps {
  symbol: string
}

export function TradingViewChart({ symbol }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return

    // TradingView widget configuration
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}USDT`,
          interval: "15",
          timezone: "Europe/London",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: false,
          container_id: container.current?.id || "tradingview_widget",
          studies: [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies"
          ],
          show_popup_button: true,
          popup_width: "1000",
          popup_height: "650"
        })
      }
    }

    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [symbol])

  return (
    <Card className="p-0 overflow-hidden">
      <div 
        id="tradingview_widget"
        ref={container}
        className="h-[500px] w-full"
      />
    </Card>
  )
}


