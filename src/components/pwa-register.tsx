"use client";

import { useEffect } from "react";

/**
 * Registers the installability service worker (spec: PWA / "Add to Home
 * Screen"). Rendered once from the root layout; no UI of its own.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability is a progressive enhancement — if registration
      // fails (e.g. unsupported browser), the app still works normally.
    });
  }, []);

  return null;
}
