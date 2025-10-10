import * as React from "react"
import Link from "next/link"
import { buttonVariants } from "./button"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

interface LinkButtonProps extends VariantProps<typeof buttonVariants> {
  href: string
  children: React.ReactNode
  className?: string
}

export function LinkButton({ href, className, variant, size, children }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size, className }))}
    >
      {children}
    </Link>
  )
}

