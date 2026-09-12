"use client"

import * as React from "react"
import { cn } from "./Button"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="relative flex flex-col gap-1 w-full">
        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-[var(--text-muted)]">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors placeholder:text-[var(--text-muted)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error && "border-red-500/50 focus-visible:ring-red-500/50 focus-visible:border-red-500/50",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <span className="px-1 text-xs text-[var(--danger)]">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"
