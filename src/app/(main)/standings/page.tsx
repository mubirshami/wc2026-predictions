import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getTeamFlagUrl } from "@/lib/constants/teams";
import { cn } from "@/lib/utils";

export const revalidate = 60;

interface StandingRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

function computeGroup(matches: {
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  status: string;
}[]): StandingRow[] {
  const table = new Map<string, StandingRow>();

  function getOrCreate(team: string): StandingRow {
    if (!table.has(team)) {
      table.set(team, { team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 });
    }
    return table.get(team)!;
  }

  for (const m of matches) {
    const home = getOrCreate(m.home_team);
    const away = getOrCreate(m.away_team);

    if (m.status === "completed" && m.home_score !== null && m.away_score !== null) {
      home.played++;
      away.played++;
      home.goalsFor += m.home_score;
      home.goalsAgainst += m.away_score;
      away.goalsFor += m.away_score;
      away.goalsAgainst += m.home_score;

      if (m.winner === "home") {
        home.won++; home.points += 3;
        away.lost++;
      } else if (m.winner === "away") {
        away.won++; away.points += 3;
        home.lost++;
      } else if (m.winner === "draw") {
        home.drawn++; home.points++;
        away.drawn++; away.points++;
      }
    } else {
      // Ensure teams appear even if match not played yet
      getOrCreate(m.home_team);
      getOrCreate(m.away_team);
    }
  }

  return [...table.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team);
  }).map((row) => ({ ...row, goalDiff: row.goalsFor - row.goalsAgainst }));
}

export default async function StandingsPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("home_team, away_team, home_score, away_score, winner, status, group_name")
    .eq("stage", "group")
    .order("kickoff_at", { ascending: true });

  if (!matches || matches.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Group Standings</h1>
        <p className="text-muted-foreground text-sm">No group stage fixtures found yet.</p>
      </div>
    );
  }

  // Group by group_name
  const groupMap = new Map<string, typeof matches>();
  for (const m of matches) {
    const g = m.group_name ?? "?";
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(m);
  }

  const sortedGroups = [...groupMap.keys()].sort();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Group Standings</h1>

      <div className="space-y-5">
        {sortedGroups.map((groupName) => {
          const groupMatches = groupMap.get(groupName)!;
          const rows = computeGroup(groupMatches);

          return (
            <div key={groupName} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              {/* Group header */}
              <div className="px-4 py-3 bg-muted/30 border-b border-border/40 flex items-center justify-between">
                <span className="text-sm font-bold tracking-tight">Group {groupName}</span>
                <span className="text-xs text-muted-foreground">
                  {groupMatches.filter((m) => m.status === "completed").length}/{groupMatches.length} played
                </span>
              </div>

              {/* Column headers */}
              <div className="grid items-center border-b border-border/30 bg-muted/10 px-4 py-2"
                style={{ gridTemplateColumns: "1fr repeat(8, auto)" }}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Team</span>
                {["P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h) => (
                  <span key={h} className={cn(
                    "text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center w-7",
                    h === "Pts" && "text-foreground"
                  )}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/30">
                {rows.map((row, i) => {
                  const qualified = i < 2; // top 2 advance (adjust if format differs)
                  return (
                    <div
                      key={row.team}
                      className={cn(
                        "grid items-center px-4 py-2.5 transition-colors hover:bg-muted/20",
                        qualified && "bg-primary/3"
                      )}
                      style={{ gridTemplateColumns: "1fr repeat(8, auto)" }}
                    >
                      {/* Team */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          "text-sm font-bold w-4 shrink-0 tabular-nums",
                          qualified ? "text-primary" : "text-muted-foreground"
                        )}>
                          {i + 1}
                        </span>
                        <Image
                          src={getTeamFlagUrl(row.team)}
                          alt={row.team}
                          width={24}
                          height={16}
                          className="h-4 w-6 object-cover rounded-sm shrink-0"
                        />
                        <span className="text-sm font-medium truncate">{row.team}</span>
                        {qualified && (
                          <span className="hidden sm:block text-xs text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                            ADV
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      {[row.played, row.won, row.drawn, row.lost, row.goalsFor, row.goalsAgainst].map((val, j) => (
                        <span key={j} className="text-sm text-muted-foreground text-center w-7 tabular-nums">
                          {val}
                        </span>
                      ))}
                      <span className={cn(
                        "text-sm text-center w-7 tabular-nums font-medium",
                        row.goalDiff > 0 ? "text-primary" : row.goalDiff < 0 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </span>
                      <span className="text-sm font-bold text-center w-7 tabular-nums">
                        {row.points}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Advancement legend */}
              <div className="px-4 py-2 border-t border-border/30 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                <span className="text-xs text-muted-foreground">Top 2 advance to Round of 32</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
