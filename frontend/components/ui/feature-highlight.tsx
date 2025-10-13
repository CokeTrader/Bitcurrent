"use client"

import { Card } from "./card"
import { LucideIcon } from "lucide-react"

interface FeatureHighlightProps {
  icon: LucideIcon
  title: string
  description: string
  stat?: string
  statLabel?: string
}

export function FeatureHighlight({ 
  icon: Icon, 
  title, 
  description, 
  stat, 
  statLabel 
}: FeatureHighlightProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          {stat && (
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-primary">{stat}</div>
              {statLabel && <div className="text-xs text-muted-foreground">{statLabel}</div>}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}


