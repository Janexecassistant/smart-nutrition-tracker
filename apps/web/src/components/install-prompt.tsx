"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if previously dismissed (respect for 7 days)
    const dismissedAt = localStorage.getItem("snt-install-dismissed");
    if (dismissedAt) {
      const daysAgo = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysAgo < 7) return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isiOS);

    // On iOS, show after a short delay since there's no beforeinstallprompt
    if (isiOS) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop Chrome — listen for the native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    setShowIOSGuide(false);
    setDismissed(true);
    localStorage.setItem("snt-install-dismissed", String(Date.now()));
  }

  if (!showBanner || dismissed) return null;

  // iOS Share Sheet guide modal
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />
        <div className="relative bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-bold text-neutral-800 mb-4">Install on iPhone</h3>
          <div className="space-y-4">
            <Step num={1}>
              Tap the <strong>Share</strong> button{" "}
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-50 rounded text-blue-500 text-sm align-middle">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span>{" "}
              in your browser toolbar
            </Step>
            <Step num={2}>
              Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>
            </Step>
            <Step num={3}>
              Tap <strong>&ldquo;Add&rdquo;</strong> in the top right
            </Step>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full mt-5 py-2.5 bg-neutral-100 text-neutral-600 font-medium rounded-xl text-sm hover:bg-neutral-200 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  // Install banner
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
      <div className="bg-gradient-to-r from-slate-900 to-emerald-900 text-white rounded-2xl p-4 shadow-2xl border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <img src="/icons/icon-96.png" alt="SNT" className="w-8 h-8 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install Smart Nutrition Tracker</p>
            <p className="text-xs text-slate-300 mt-0.5">
              Add to your home screen for quick access, offline support, and a native app feel.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0 p-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white/60 hover:text-white/90 text-sm font-medium rounded-xl transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {num}
      </div>
      <p className="text-sm text-neutral-600 pt-0.5">{children}</p>
    </div>
  );
}
