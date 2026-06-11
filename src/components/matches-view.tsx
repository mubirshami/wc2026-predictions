"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MatchCard } from "@/components/match-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [activeTab, setActiveTab] = useState(defaultTab);

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
        <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
        {live.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-primary font-medium">
            <span className="live-indicator h-2 w-2 rounded-full bg-primary inline-block" />
            {live.length} live now
          </span>
        )}
      </div>

      <PredictionHint />

      <Tabs defaultValue={defaultTab} onValueChange={(v) => { setSelectedGroup("All"); setActiveTab(v); }}>
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

          {/* Desktop group dropdown */}
          {(() => {
            const groups = getGroups(activeTab === "live" ? live : activeTab === "completed" ? completed : upcoming);
            if (groups.length < 2) return null;
            return (
              <div className="hidden sm:block shrink-0">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="h-9 w-36 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-44">
                    <SelectItem value="All">All Groups</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g} value={g}>Group {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
        </div>

        {/* Mobile group pills */}
        <div className="sm:hidden mt-3">
          <GroupFilter
            groups={getGroups(activeTab === "live" ? live : activeTab === "completed" ? completed : upcoming)}
            selected={selectedGroup}
            onChange={setSelectedGroup}
          />
        </div>

        <TabsContent value="live" className="mt-4">
          <MatchGrid matches={filterByGroup(live)} emptyMessage="No live matches right now" />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <MatchGridGrouped matches={filterByGroup(upcoming)} emptyMessage="No upcoming matches scheduled" />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <MatchGridGrouped matches={filterByGroup(completed)} emptyMessage="No completed matches yet" reverse />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GroupFilter({
  groups,
  selected,
  onChange,
}: {
  groups: string[];
  selected: string;
  onChange: (g: string) => void;
}) {
  if (groups.length < 2) return null;
  const all = ["All", ...groups];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {all.map((g) => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
            selected === g
              ? "bg-primary text-primary-foreground"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {g === "All" ? "All" : `Group ${g}`}
        </button>
      ))}
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
