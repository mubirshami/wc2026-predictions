"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MatchCard } from "@/components/match-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatchWithPrediction } from "@/types";
import { Loader2 } from "lucide-react";

interface MatchesViewProps {
  matches: MatchWithPrediction[];
}

export function MatchesView({ matches: initialMatches }: MatchesViewProps) {
  const [matches, setMatches] = useState(initialMatches);

  // Subscribe to real-time match score updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("matches-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          setMatches((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? { ...m, ...payload.new, user_prediction: m.user_prediction }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const completed = matches.filter((m) => m.status === "completed");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matches</h1>
        {live.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-red-400 font-medium">
            <span className="live-indicator">●</span>
            {live.length} live
          </span>
        )}
      </div>

      <Tabs defaultValue={live.length > 0 ? "live" : "upcoming"}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="live" className="flex-1 sm:flex-none">
            Live {live.length > 0 && <span className="ml-1.5 text-red-400">({live.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
            Upcoming{" "}
            {upcoming.length > 0 && (
              <span className="ml-1.5 text-muted-foreground">({upcoming.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 sm:flex-none">
            Completed{" "}
            {completed.length > 0 && (
              <span className="ml-1.5 text-muted-foreground">({completed.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <MatchGrid matches={live} emptyMessage="No live matches right now" />
        </TabsContent>

        <TabsContent value="upcoming">
          <MatchGrid matches={upcoming} emptyMessage="No upcoming matches scheduled" />
        </TabsContent>

        <TabsContent value="completed">
          <MatchGrid matches={completed} emptyMessage="No completed matches yet" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MatchGrid({
  matches,
  emptyMessage,
}: {
  matches: MatchWithPrediction[];
  emptyMessage: string;
}) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 mb-3 opacity-20" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
