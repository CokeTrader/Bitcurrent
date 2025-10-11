"use client"

import * as React from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "./button"

export function BetaBanner() {
  const [isVisible, setIsVisible] = React.useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-warning/10 border-b border-warning/30 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              <span className="font-bold">Live Beta:</span> This platform is in beta testing. 
              Trade at your own risk. <span className="font-semibold">FCA Registration Pending.</span>
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}







