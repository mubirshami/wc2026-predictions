"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

const DISMISSED_KEY = "scoracle_pwa_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Already installed — running as standalone PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (ios) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/30 p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-2xl">
          🏆
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Add Scoracle to Home Screen</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Tap <Share className="inline h-3 w-3 mx-0.5 shrink-0" /> then <strong className="text-foreground">Add to Home Screen</strong>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Get the full app experience — no browser bar
            </p>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Install button — Android/Chrome only */}
      {!isIOS && deferredPrompt && (
        <button
          onClick={install}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-2.5 transition-opacity hover:opacity-90 active:scale-95"
        >
          <Download className="h-4 w-4" />
          Install App
        </button>
      )}
    </div>
  );
}
