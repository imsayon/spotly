"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Register service worker for background notifications
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);

        // Check for updates periodically
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New version available, skip waiting to activate immediately
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_ACTIVATED") {
        console.log("Service Worker activated");
      }
    });
  }, []);

  return null;
}
