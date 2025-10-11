import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "./card"
import { LucideIcon } from "lucide-react"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  change?: {
    value: number
    type?: "percentage" | "absolute"
  }
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  loading?: boolean
  variant?: "default" | "primary" | "success" | "danger"
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  trend = "neutral",
  loading = false,
  variant = "default",
  className,
  ...props
}: StatCardProps) {
  const variantStyles = {
    default: "",
    primary: "border-primary/50 bg-primary/5",
    success: "border-success/50 bg-success/5",
    danger: "border-danger/50 bg-danger/5",
  }

  const trendColors = {
    up: "text-success",
    down: "text-danger",
    neutral: "text-muted-foreground",
  }

  return (
    <Card
      className={cn(
        "p-6 transition-all hover:shadow-lg",
        variantStyles[variant],
        "card-hover",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-8 w-32 skeleton rounded-md" />
          ) : (
            <>
              <p className="text-3xl font-bold font-mono tracking-tight counter-animate">
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {change && (
                <div className={cn("flex items-center gap-1 text-sm font-medium", trendColors[trend])}>
                  {change.type === "percentage" ? (
                    <span>{change.value > 0 ? "+" : ""}{change.value.toFixed(2)}%</span>
                  ) : (
                    <span>{change.value > 0 ? "+" : ""}{change.value}</span>
                  )}
                  <span className="text-xs text-muted-foreground">today</span>
                </div>
              )}
            </>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "rounded-lg p-3",
            variant === "default" && "bg-muted",
            variant === "primary" && "bg-primary/10 text-primary",
            variant === "success" && "bg-success/10 text-success",
            variant === "danger" && "bg-danger/10 text-danger"
          )}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  )
}







