"use client"

import React from "react";

export const Orb = ({
  x,
  y,
  size,
  color,
  anim,
  opacity = 0.28,
}: {
  x: string;
  y: string;
  size: string;
  color: string;
  anim: string;
  opacity?: number;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      filter: "blur(90px)",
      opacity,
      pointerEvents: "none",
      animation: anim,
    }}
  />
);
