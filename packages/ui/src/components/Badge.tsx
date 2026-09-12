"use client"

import * as React from "react"
import { cn } from "./Button"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "merchant" | "consumer";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-2",
        {
          "border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)]": variant === "default",
          "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]": variant === "success" || variant === "merchant",
          "border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]": variant === "warning",
          "border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]": variant === "destructive",
          "border-[var(--brand)]/30 bg-[var(--brand-soft)] text-[var(--brand-strong)]": variant === "consumer",
        },
        className
      )}
      {...props}
    />
  )
}
