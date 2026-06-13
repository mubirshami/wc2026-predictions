"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { saveSubscription, removeSubscription } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

type State = "loading" | "unsupported" | "denied" | "enabled" | "disabled";

export function NotificationToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) { setState("disabled"); return; }
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? "enabled" : "disabled");
      });
    });
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") { setState("denied"); return; }
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return; // no SW in dev — nothing to subscribe
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      await saveSubscription(JSON.stringify(sub));
      setState("enabled");
    } catch (err) {
      console.error("[push] enable failed:", err);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await removeSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
      }
      setState("disabled");
    } catch (err) {
      console.error("[push] disable failed:", err);
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported" || state === "loading") return null;

  const isOn = state === "enabled";
  const isDenied = state === "denied";

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card px-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
          isOn ? "bg-primary/15 border border-primary/20" : "bg-muted/60 border border-border/40"
        )}>
          {isOn
            ? <Bell className="h-4 w-4 text-primary" />
            : <BellOff className="h-4 w-4 text-muted-foreground" />
          }
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Push Notifications</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isDenied
              ? "Blocked — enable in your browser settings"
              : isOn
              ? "Match reminders & result alerts on"
              : "Enable to get match reminders & results"
            }
          </p>
        </div>
      </div>

      {!isDenied && (
        <button
          onClick={isOn ? disable : enable}
          disabled={busy}
          aria-label={isOn ? "Disable notifications" : "Enable notifications"}
          className={cn(
            "relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50",
            isOn ? "bg-primary" : "bg-muted"
          )}
        >
          <span className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            isOn ? "translate-x-5" : "translate-x-0"
          )} />
        </button>
      )}
    </div>
  );
}
