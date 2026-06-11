import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getTeamFlagUrl } from "@/lib/constants/teams";
import { Users, Trophy, Target, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LeaderboardEntry } from "@/types";
import { cn } from "@/lib/utils";

export const revalidate = 60;

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("leaderboard")
    .select("*")
    .limit(100);

  const leaderboard = (entries ?? []) as LeaderboardEntry[];
  const currentUserEntry = leaderboard.find((e) => e.id === user?.id);

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{leaderboard.length} {leaderboard.length === 1 ? "player" : "players"}</span>
        </div>
      </div>

      {/* Your stats card — always visible */}
      {currentUserEntry && (
        <Card className="border-primary/25 bg-primary/5">
          <CardContent className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-black text-primary text-sm">
                  {MEDAL[currentUserEntry.rank] ?? `#${currentUserEntry.rank}`}
                </div>
                {currentUserEntry.favorite_team && (
                  <Image
                    src={getTeamFlagUrl(currentUserEntry.favorite_team)}
                    alt={currentUserEntry.favorite_team}
                    width={36}
                    height={24}
                    className="h-6 w-9 object-cover rounded-md shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {currentUserEntry.username}
                    <span className="ml-1.5 text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">you</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Rank #{currentUserEntry.rank}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 shrink-0">
                <Stat icon={<Trophy className="h-3.5 w-3.5" />} value={currentUserEntry.total_points} label="pts" highlight />
                <Stat icon={<Target className="h-3.5 w-3.5" />} value={currentUserEntry.correct_predictions} label="correct" />
                <Stat icon={<Percent className="h-3.5 w-3.5" />} value={`${currentUserEntry.accuracy}%`} label="acc" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings */}
      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            No predictions made yet. Be the first!
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 px-4 py-2.5 border-b border-border/50 bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8 text-center">#</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Player</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right hidden sm:block">Correct</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right hidden sm:block">Accuracy</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Points</span>
          </div>

          <div className="divide-y divide-border/40">
            {leaderboard.map((entry, i) => {
              const isMe = entry.id === user?.id;
              const medal = MEDAL[entry.rank];
              const isTop3 = entry.rank <= 3;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 px-4 py-3 transition-colors",
                    isMe ? "bg-primary/5" : i % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                    "hover:bg-muted/20"
                  )}
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {medal ? (
                      <span className="text-lg leading-none">{medal}</span>
                    ) : (
                      <span className={cn(
                        "text-sm font-bold tabular-nums",
                        isMe ? "text-primary" : "text-muted-foreground"
                      )}>
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {entry.favorite_team ? (
                      <Image
                        src={getTeamFlagUrl(entry.favorite_team)}
                        alt={entry.favorite_team}
                        width={28}
                        height={20}
                        className="h-5 w-7 object-cover rounded-sm shrink-0"
                      />
                    ) : (
                      <div className="h-5 w-7 rounded-sm bg-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className={cn(
                        "text-sm font-semibold truncate block",
                        isTop3 && !isMe && "text-foreground",
                        isMe && "text-primary"
                      )}>
                        {entry.username}
                        {isMe && (
                          <span className="ml-1.5 text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">you</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:block">{entry.favorite_team}</span>
                    </div>
                  </div>

                  {/* Correct */}
                  <span className="text-sm tabular-nums text-muted-foreground text-right hidden sm:block">
                    {entry.correct_predictions}<span className="text-muted-foreground/50">/{entry.total_predictions}</span>
                  </span>

                  {/* Accuracy */}
                  <span className="text-sm tabular-nums text-muted-foreground text-right hidden sm:block">
                    {entry.accuracy}%
                  </span>

                  {/* Points */}
                  <span className={cn(
                    "text-sm font-bold tabular-nums text-right",
                    isMe ? "text-primary" : isTop3 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {entry.total_points}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">pt</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  highlight = false,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={cn("flex items-center gap-1", highlight ? "text-primary" : "text-muted-foreground")}>
        {icon}
        <span className={cn("text-base font-black tabular-nums", highlight ? "text-primary" : "text-foreground")}>
          {value}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}
