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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-zinc-800 text-zinc-100": variant === "default",
          "border-transparent bg-emerald-500/15 text-emerald-400": variant === "success",
          "border-transparent bg-yellow-500/15 text-yellow-400": variant === "warning",
          "border-transparent bg-red-500/15 text-red-400": variant === "destructive",
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]": variant === "merchant",
          "border-[#F5A623]/30 bg-[#F5A623]/10 text-[#F5A623] shadow-[0_0_10px_rgba(245,166,35,0.1)]": variant === "consumer",
        },
        className
      )}
      {...props}
    />
  )
}
