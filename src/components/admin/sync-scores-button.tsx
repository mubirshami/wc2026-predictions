"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SyncScoresButton() {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sync-scores", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      toast.success(
        `Scores synced — ${data.updated} match${data.updated !== 1 ? "es" : ""} updated`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleSync} disabled={loading} variant="outline">
      <Activity className={`h-4 w-4 mr-2 ${loading ? "animate-pulse" : ""}`} />
      {loading ? "Syncing…" : "Sync Scores"}
    </Button>
  );
}
