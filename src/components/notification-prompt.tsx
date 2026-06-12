"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { saveSubscription } from "@/app/actions/notifications";

const DISMISSED_KEY = "scoracle_notif_dismissed";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      Notification.permission === "granted" ||
      Notification.permission === "denied" ||
      localStorage.getItem(DISMISSED_KEY)
    ) return;

    // Show after a short delay — let the page settle first
    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function enable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { dismiss(); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await saveSubscription(JSON.stringify(sub));
      localStorage.setItem(DISMISSED_KEY, "1");
      setShow(false);
    } catch (err) {
      console.error("[push] subscription failed:", err);
      dismiss();
    } finally {
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/30 p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Never miss a match</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Get notified before voting locks and when results are in
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={dismiss}
          className="flex-1 rounded-xl border border-border/50 text-sm text-muted-foreground py-2 hover:bg-muted/50 transition-colors"
        >
          Not now
        </button>
        <button
          onClick={enable}
          disabled={loading}
          className="flex-1 rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Enabling…" : "Enable"}
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
