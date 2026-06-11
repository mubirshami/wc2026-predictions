"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MatchCard } from "@/components/match-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatchWithPrediction } from "@/types";

interface MatchesViewProps {
  matches: MatchWithPrediction[];
}

export function MatchesView({ matches: initialMatches }: MatchesViewProps) {
  const [matches, setMatches] = useState(initialMatches);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("matches-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, (payload) => {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === payload.new.id ? { ...m, ...payload.new, user_prediction: m.user_prediction } : m
          )
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const completed = matches.filter((m) => m.status === "completed");

  const defaultTab = live.length > 0 ? "live" : "upcoming";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
        {live.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-primary font-medium">
            <span className="live-indicator h-2 w-2 rounded-full bg-primary inline-block" />
            {live.length} live now
          </span>
        )}
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full sm:w-auto h-9 p-1 gap-0.5">
          <TabsTrigger value="live" className="flex-1 sm:flex-none h-7 text-xs gap-1.5">
            Live
            {live.length > 0 && (
              <span className="h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {live.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-none h-7 text-xs gap-1.5">
            Upcoming
            {upcoming.length > 0 && (
              <span className="text-[10px] text-muted-foreground">({upcoming.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 sm:flex-none h-7 text-xs gap-1.5">
            Completed
            {completed.length > 0 && (
              <span className="text-[10px] text-muted-foreground">({completed.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-4">
          <MatchGrid matches={live} emptyMessage="No live matches right now" />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <MatchGridGrouped matches={upcoming} emptyMessage="No upcoming matches scheduled" />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <MatchGridGrouped matches={completed} emptyMessage="No completed matches yet" reverse />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MatchGrid({ matches, emptyMessage }: { matches: MatchWithPrediction[]; emptyMessage: string }) {
  if (matches.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => <MatchCard key={match.id} match={match} />)}
    </div>
  );
}

function MatchGridGrouped({
  matches,
  emptyMessage,
  reverse = false,
}: {
  matches: MatchWithPrediction[];
  emptyMessage: string;
  reverse?: boolean;
}) {
  if (matches.length === 0) return <EmptyState message={emptyMessage} />;

  const groups = new Map<string, MatchWithPrediction[]>();
  for (const match of matches) {
    // Group by user's LOCAL date, not UTC
    const localDay = new Date(match.kickoff_at).toDateString();
    if (!groups.has(localDay)) groups.set(localDay, []);
    groups.get(localDay)!.push(match);
  }

  const todayStr = new Date().toDateString();

  const sortedDays = [...groups.keys()].sort((a, b) => {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    return reverse ? db - da : da - db;
  });

  return (
    <div className="space-y-6">
      {sortedDays.map((day) => {
        const dayMatches = groups.get(day)!;
        const date = new Date(day);
        const isToday = day === todayStr;
        const isTomorrow = day === new Date(Date.now() + 86400000).toDateString();
        const label = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en", {
          weekday: "short", month: "short", day: "numeric",
        });

        return (
          <div key={day} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground/70"}`}>
                {label}
              </span>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground">
                {dayMatches.length} match{dayMatches.length !== 1 ? "es" : ""}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dayMatches.map((match) => <MatchCard key={match.id} match={match} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="grid grid-cols-2 gap-2 opacity-10">
        <Skeleton className="h-16 w-24 rounded-xl" />
        <Skeleton className="h-16 w-24 rounded-xl" />
        <Skeleton className="h-16 w-24 rounded-xl" />
        <Skeleton className="h-16 w-24 rounded-xl" />
      </div>
      <p className="text-sm text-muted-foreground mt-2">{message}</p>
    </div>
  );
}
