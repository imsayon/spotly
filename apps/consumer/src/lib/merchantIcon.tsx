"use client";

import React from "react";
import { Ic } from "@spotly/ui";

export function getMerchantIcon(input?: string) {
  const value = (input || "").toLowerCase();

  if (value.includes("coffee") || value.includes("brew") || value.includes("cafe")) return <Ic.Clock />;
  if (value.includes("health") || value.includes("clinic") || value.includes("pharmacy") || value.includes("dental")) return <Ic.Activity />;
  if (value.includes("bakery")) return <Ic.Store />;
  if (value.includes("bank") || value.includes("finance")) return <Ic.Building />;
  if (value.includes("beauty") || value.includes("salon")) return <Ic.Star />;
  if (value.includes("dining") || value.includes("restaurant")) return <Ic.Grid />;
  return <Ic.Store />;
}
