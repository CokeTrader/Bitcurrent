import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, AlertCircle } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-sell ring-sell/20",
            success && "border-buy ring-buy/20",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {/* Success indicator */}
        {success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="h-4 w-4 text-buy" aria-hidden="true" />
          </div>
        )}
        {/* Error indicator */}
        {error && (
          <>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-sell" aria-hidden="true" />
            </div>
            <p
              id={`${props.id}-error`}
              className="mt-1 text-xs text-sell flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {error}
            </p>
          </>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }



