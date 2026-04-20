"use client"

import React from "react"
import { Ic } from "@spotly/ui"

export function getMerchantIcon(category?: string) {
  const key = (category || "").toLowerCase()

  if (key.includes("coffee")) return <Ic.Clock />
  if (key.includes("pharmacy") || key.includes("health")) return <Ic.Activity />
  if (key.includes("bakery") || key.includes("dining")) return <Ic.Grid />
  if (key.includes("finance")) return <Ic.Shield />
  if (key.includes("beauty")) return <Ic.Sparkle />

  return <Ic.Store />
}
