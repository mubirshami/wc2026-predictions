"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function BracketRefresher() {
  const router = useRouter();

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => router.refresh(), 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
