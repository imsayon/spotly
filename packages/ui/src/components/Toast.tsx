"use client"

import React, { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 90,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            borderRadius: 14,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            background:
              t.type === "success"
                ? "rgba(31,217,124,.15)"
                : t.type === "error"
                  ? "rgba(255,77,109,.15)"
                  : "rgba(255,255,255,.1)",
            border: `1px solid ${
              t.type === "success"
                ? "rgba(31,217,124,.3)"
                : t.type === "error"
                  ? "rgba(255,77,109,.3)"
                  : "rgba(255,255,255,.15)"
            }`,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            maxWidth: 300,
            pointerEvents: "auto",
            animation: "slideInR .35s cubic-bezier(.22,1,.36,1)",
            boxShadow: "0 8px 32px rgba(0,0,0,.4)",
          }}
        >
          <span style={{ fontSize: 18 }}>
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const add = useCallback((msg: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);
  
  return { toasts, add };
}
