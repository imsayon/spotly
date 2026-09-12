"use client";

import { useSyncExternalStore } from "react";

export type ToastType = "success" | "error" | "info";
export interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}
const empty: Toast[] = [];
let messages: Toast[] = empty;
let nextId = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const publish = () => listeners.forEach((listener) => listener());
const dismiss = (id: number) => {
  messages = messages.filter((toast) => toast.id !== id);
  publish();
};
const add = (msg: string, type: ToastType = "info") => {
  const id = ++nextId;
  messages = [...messages.slice(-3), { id, msg, type }];
  publish();
  if (type !== "error") setTimeout(() => dismiss(id), 6000);
};

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(80px + env(safe-area-inset-bottom))",
        right: 20,
        left: 20,
        zIndex: 9999,
        display: "grid",
        justifyItems: "end",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--surface, #FFFDF9)",
            border: `1px solid var(--${toast.type === "error" ? "danger" : toast.type === "success" ? "success" : "border-strong"})`,
            color: "var(--text-primary)",
            fontSize: 14,
            lineHeight: "20px",
            maxWidth: 420,
            pointerEvents: "auto",
          }}
        >
          <span>{toast.msg}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismiss(toast.id)}
            style={{
              background: "none",
              border: 0,
              color: "inherit",
              minWidth: 44,
              minHeight: 44,
              cursor: "pointer",
              fontSize: 22,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToasts() {
  const toasts = useSyncExternalStore(
    subscribe,
    () => messages,
    () => empty,
  );
  return { toasts, add };
}
