"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MatchCard } from "@/components/match-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { isMatchDayOpen, isMatchLocked } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MatchWithPrediction } from "@/types";

const HINT_KEY = "scoracle_prediction_hint_dismissed";

function PredictionHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(HINT_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(HINT_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <span className="text-base shrink-0 mt-0.5">⚽</span>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">How to predict</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Tap the <span className="text-foreground font-medium">team name or flag</span> on any match card to cast your vote — group matches also have a <span className="text-foreground font-medium">Draw</span> option</li>
            <li>• Predictions <span className="text-foreground font-medium">open 24 hours before kickoff</span> — cards show the exact time they unlock</li>
            <li>• You can <span className="text-foreground font-medium">change your pick freely</span> until <span className="text-foreground font-medium">15 minutes before kickoff</span>, then it locks</li>
          </ul>
        </div>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface MatchesViewProps {
  matches: MatchWithPrediction[];
}

export function MatchesView({ matches: initialMatches }: MatchesViewProps) {
  const [matches, setMatches] = useState(initialMatches);
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [predFilter, setPredFilter] = useState<"all" | "open">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Sync server-refreshed data into state (router.refresh() updates props but not useState)
  useEffect(() => {
    setMatches(initialMatches);
    setIsRefreshing(false);
  }, [initialMatches]);

  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const completed = matches.filter((m) => m.status === "completed");

  const [activeTab, setActiveTab] = useState("upcoming");

  // Realtime subscription with reconnection on error
  useEffect(() => {
    const supabase = createClient();

    function subscribe() {
      return supabase
        .channel("matches-realtime")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, (payload) => {
          setMatches((prev) =>
            prev.map((m) =>
              m.id === payload.new.id ? { ...m, ...payload.new, user_prediction: m.user_prediction } : m
            )
          );
        })
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "CLOSED") {
            setTimeout(() => { supabase.removeAllChannels(); subscribe(); }, 3000);
          }
        });
    }

    const channel = subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-switch to Live tab only when a new match transitions to live
  const prevLiveCount = useRef(live.length);
  useEffect(() => {
    if (live.length > prevLiveCount.current) setActiveTab("live");
    prevLiveCount.current = live.length;
  }, [live.length]);

  // Refresh immediately when user returns to the app (PWA resume / tab switch back)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") { setIsRefreshing(true); router.refresh(); }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  // Polling fallback — poll aggressively near kickoff and during live matches
  useEffect(() => {
    const hasLive = matches.some((m) => m.status === "live");
    const hasNearKickoff = matches.some((m) => {
      if (m.status !== "upcoming") return false;
      const diff = new Date(m.kickoff_at).getTime() - Date.now();
      return diff >= 0 && diff < 10 * 60 * 1000;
    });
    const interval = hasLive || hasNearKickoff ? 20_000 : 60_000;
    const timer = setInterval(() => { setIsRefreshing(true); router.refresh(); }, interval);
    return () => clearInterval(timer);
  }, [matches, router]);

  function getGroups(list: MatchWithPrediction[]) {
    const seen = new Set<string>();
    const groups: string[] = [];
    for (const m of list) {
      if (m.group_name && !seen.has(m.group_name)) {
        seen.add(m.group_name);
        groups.push(m.group_name);
      }
    }
    return groups.sort();
  }

  function filterByGroup(list: MatchWithPrediction[]) {
    if (selectedGroup === "All") return list;
    return list.filter((m) => m.group_name === selectedGroup);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
          {isRefreshing && (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse" />
          )}
        </div>
        {live.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-primary font-medium">
            <span className="live-indicator h-2 w-2 rounded-full bg-primary inline-block" />
            {live.length} live now
          </span>
        )}
      </div>

      <PredictionHint />

      <Tabs value={activeTab} onValueChange={(v) => { setSelectedGroup("All"); setActiveTab(v); }}>
        {/* Tabs row — with dropdown on right for sm+ */}
        <div className="flex items-center justify-between gap-3">
          <TabsList className="w-full sm:w-auto h-10 p-1 gap-0.5">
            <TabsTrigger value="live" className="flex-1 sm:flex-none h-8 text-sm gap-1.5">
              Live
              {live.length > 0 && (
                <span className="h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center px-1">
                  {live.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1 sm:flex-none h-8 text-sm gap-1.5">
              Upcoming
              {upcoming.length > 0 && (
                <span className="text-xs text-muted-foreground">({upcoming.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 sm:flex-none h-8 text-sm gap-1.5">
              Completed
              {completed.length > 0 && (
                <span className="text-xs text-muted-foreground">({completed.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Dropdowns — same row on sm+ */}
          {(() => {
            const groups = getGroups(activeTab === "live" ? live : activeTab === "completed" ? completed : upcoming);
            const showGroup = groups.length >= 2;
            const showPred = activeTab === "upcoming";
            if (!showGroup && !showPred) return null;
            return (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                {showGroup && (
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="h-9 w-36 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-44">
                      <SelectItem value="All">All Groups</SelectItem>
                      {groups.map((g) => <SelectItem key={g} value={g}>Group {g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {showPred && (
                  <Select value={predFilter} onValueChange={(v) => setPredFilter(v as "all" | "open")}>
                    <SelectTrigger className="h-9 w-44 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Matches</SelectItem>
                      <SelectItem value="open">Predictions Open</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })()}
        </div>

        {/* Mobile filter row */}
        {(() => {
          const groups = getGroups(upcoming);
          const showGroup = groups.length >= 2;
          const showPred = activeTab === "upcoming";
          if (!showGroup && !showPred) return null;
          return (
            <div className="flex sm:hidden gap-2 mt-3">
              {showGroup && (
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="h-9 flex-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-44">
                    <SelectItem value="All">All Groups</SelectItem>
                    {groups.map((g) => <SelectItem key={g} value={g}>Group {g}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {showPred && (
                <Select value={predFilter} onValueChange={(v) => setPredFilter(v as "all" | "open")}>
                  <SelectTrigger className="h-9 flex-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Matches</SelectItem>
                    <SelectItem value="open">Predictions Open</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })()}

        <TabsContent value="live" className="mt-4">
          <MatchGrid matches={filterByGroup(live)} emptyMessage="No live matches right now" />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <MatchGridGrouped
            matches={filterByGroup(upcoming).filter((m) =>
              predFilter === "open" ? isMatchDayOpen(m.kickoff_at) && !isMatchLocked(m.kickoff_at) : true
            )}
            emptyMessage="No upcoming matches scheduled"
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <MatchGridGrouped matches={filterByGroup(completed)} emptyMessage="No completed matches yet" reverse />
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
              <span className={`text-base font-semibold ${isToday ? "text-primary" : "text-foreground/70"}`}>
                {label}
              </span>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-sm text-muted-foreground">
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
