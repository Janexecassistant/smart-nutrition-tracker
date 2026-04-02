"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SNT] Service worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SNT] Service worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
