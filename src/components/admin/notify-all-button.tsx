"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotifyAllButton() {
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notify-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🔥 Quarter Finals — Stakes just doubled",
          message: "QF & 3rd: +10/−20 · SF: +20/−30 · Final: +30/−50. One wrong pick can flip the table.",
          url: "/matches",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Notification sent to all users");
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={send}
      disabled={loading}
      className="gap-1.5"
    >
      <Bell className="h-4 w-4" />
      {loading ? "Sending…" : "Notify All"}
    </Button>
  );
}
