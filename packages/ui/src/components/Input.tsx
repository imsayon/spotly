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
            <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-zinc-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground shadow-sm transition-all placeholder:text-zinc-500",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error && "border-red-500/50 focus-visible:ring-red-500/50 focus-visible:border-red-500/50",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-red-500 px-1">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"
