import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getTeamFlagUrl } from "@/lib/constants/teams";
import { BracketRefresher } from "@/components/bracket-refresher";
import { cn } from "@/lib/utils";
import type { Match, MatchStage } from "@/types";

export const revalidate = 30;

// ── Layout constants ──────────────────────────────────────────────
const MATCH_H   = 60;
const ROUND_W   = 156;
const ROUND_GAP = 24;
const BASE_GAP  = 16;
const BASE_SLOT = MATCH_H + BASE_GAP; // 76px

const HEADER_H = 36;
const TOTAL_H  = 16 * BASE_SLOT + HEADER_H; // 1252px
const TOTAL_W  = 5 * ROUND_W + 4 * ROUND_GAP; // 876px

const MAIN_STAGES: MatchStage[] = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
];
const STAGE_LABEL: Record<string, string> = {
  round_of_32:   "R32",
  round_of_16:   "R16",
  quarter_final: "QF",
  semi_final:    "SF",
  final:         "Final",
};
const ROUND_SIZES = [16, 8, 4, 2, 1];

function slotH(ri: number) { return BASE_SLOT * Math.pow(2, ri); }
function matchTopY(ri: number, mi: number) {
  const sh = slotH(ri);
  return mi * sh + (sh - MATCH_H) / 2;
}
function roundLeftX(ri: number) { return ri * (ROUND_W + ROUND_GAP); }

// ── Bracket slot type ─────────────────────────────────────────────
interface BracketSlot {
  home:      string | null;
  away:      string | null;
  homeScore: number | null;
  awayScore: number | null;
  winner:    "home" | "away" | null;
  status:    "upcoming" | "live" | "completed";
}

function matchToSlot(m: Match): BracketSlot {
  return {
    home:      m.home_team,
    away:      m.away_team,
    homeScore: m.home_score,
    awayScore: m.away_score,
    winner:    m.winner ?? null,
    status:    m.status,
  };
}

function advancingTeam(slot: BracketSlot | null): string | null {
  if (!slot || slot.status !== "completed" || !slot.winner) return null;
  return slot.winner === "home" ? slot.home : slot.away;
}

// ── Compute next round from prev round winners ────────────────────
function computeNextRound(prev: (BracketSlot | null)[], size: number): (BracketSlot | null)[] {
  return Array.from({ length: size }, (_, i) => {
    const team0 = advancingTeam(prev[i * 2]);
    const team1 = advancingTeam(prev[i * 2 + 1]);
    if (!team0 && !team1) return null;
    return { home: team0, away: team1, homeScore: null, awayScore: null, winner: null, status: "upcoming" };
  });
}

// ── Page ──────────────────────────────────────────────────────────
export default async function BracketPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("*")
    .neq("stage", "group")
    .order("kickoff_at", { ascending: true });

  const matches = (data ?? []) as Match[];

  const byStage = new Map<MatchStage, Match[]>();
  for (const m of matches) {
    if (!byStage.has(m.stage)) byStage.set(m.stage, []);
    byStage.get(m.stage)!.push(m);
  }

  const thirdPlace = byStage.get("third_place")?.[0] ?? null;

  // Build rounds — use DB data when available, else compute from winners
  const rounds: (BracketSlot | null)[][] = [];

  for (let ri = 0; ri < MAIN_STAGES.length; ri++) {
    const stage = MAIN_STAGES[ri];
    const size  = ROUND_SIZES[ri];
    const dbMatches = byStage.get(stage) ?? [];

    if (ri === 0 || dbMatches.length > 0) {
      // Use DB matches, pad with nulls if fewer than expected
      const arr: (BracketSlot | null)[] = Array(size).fill(null);
      dbMatches.forEach((m, idx) => { if (idx < size) arr[idx] = matchToSlot(m); });
      rounds.push(arr);
    } else {
      // Compute from previous round winners
      rounds.push(computeNextRound(rounds[ri - 1], size));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BracketRefresher />
      <h1 className="text-2xl font-bold tracking-tight">Bracket</h1>

      {/* ── Bracket ── */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div
          className="relative select-none"
          style={{ width: TOTAL_W, height: TOTAL_H, minWidth: TOTAL_W }}
        >
          {/* Round headers */}
          {MAIN_STAGES.map((stage, ri) => (
            <div
              key={stage}
              className="absolute text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center"
              style={{ left: roundLeftX(ri), top: 0, width: ROUND_W }}
            >
              {STAGE_LABEL[stage]}
            </div>
          ))}

          {/* SVG connector lines */}
          <svg
            className="absolute pointer-events-none"
            style={{ left: 0, top: HEADER_H }}
            width={TOTAL_W}
            height={TOTAL_H - HEADER_H}
          >
            {MAIN_STAGES.slice(1).map((_, idx) => {
              const ri = idx + 1;
              return Array.from({ length: ROUND_SIZES[ri] }, (_, mi) => {
                const c0Y   = matchTopY(ri - 1, mi * 2)     + MATCH_H / 2;
                const c1Y   = matchTopY(ri - 1, mi * 2 + 1) + MATCH_H / 2;
                const pY    = matchTopY(ri, mi)              + MATCH_H / 2;
                const xFrom = roundLeftX(ri - 1) + ROUND_W;
                const xMid  = xFrom + ROUND_GAP / 2;
                const xTo   = roundLeftX(ri);
                return (
                  <g key={`${ri}-${mi}`} stroke="hsl(var(--border))" strokeWidth="1" fill="none">
                    <line x1={xFrom} y1={c0Y} x2={xMid} y2={c0Y} />
                    <line x1={xFrom} y1={c1Y} x2={xMid} y2={c1Y} />
                    <line x1={xMid}  y1={c0Y} x2={xMid} y2={c1Y} />
                    <line x1={xMid}  y1={pY}  x2={xTo}  y2={pY}  />
                  </g>
                );
              });
            })}
          </svg>

          {/* Match cards */}
          {rounds.map((roundSlots, ri) =>
            roundSlots.map((slot, mi) => (
              <div
                key={`${ri}-${mi}`}
                className="absolute"
                style={{
                  left:   roundLeftX(ri),
                  top:    HEADER_H + matchTopY(ri, mi),
                  width:  ROUND_W,
                  height: MATCH_H,
                }}
              >
                <BracketCard slot={slot} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Third place ── */}
      {thirdPlace && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Third Place
          </p>
          <div style={{ maxWidth: ROUND_W }}>
            <BracketCard slot={matchToSlot(thirdPlace)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────────
function BracketCard({ slot }: { slot: BracketSlot | null }) {
  if (!slot) {
    return (
      <div className="flex flex-col h-full rounded-lg border border-border/30 bg-card/30 overflow-hidden">
        <TBDRow />
        <div className="h-px bg-border/30" />
        <TBDRow />
      </div>
    );
  }

  const isLive      = slot.status === "live";
  const isCompleted = slot.status === "completed";
  const homeWon     = isCompleted && slot.winner === "home";
  const awayWon     = isCompleted && slot.winner === "away";

  return (
    <div className={cn(
      "flex flex-col h-full rounded-lg border bg-card overflow-hidden",
      isLive && "border-primary/50",
    )}>
      <TeamRow
        team={slot.home}
        score={slot.homeScore}
        isWinner={homeWon}
        isLoser={awayWon}
        showScore={isCompleted || isLive}
      />
      <div className="h-px bg-border/40" />
      <TeamRow
        team={slot.away}
        score={slot.awayScore}
        isWinner={awayWon}
        isLoser={homeWon}
        showScore={isCompleted || isLive}
      />
    </div>
  );
}

function TeamRow({
  team, score, isWinner, isLoser, showScore,
}: {
  team: string | null;
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  showScore: boolean;
}) {
  if (!team) return <TBDRow />;

  const short = team.length > 14 ? team.split(" ")[0] : team;
  return (
    <div className={cn(
      "flex items-center gap-2 px-2.5 flex-1 min-w-0 transition-opacity",
      isWinner && "bg-primary/8",
      isLoser  && "opacity-35",
    )}>
      <Image
        src={getTeamFlagUrl(team)}
        alt={team}
        width={22}
        height={16}
        className="h-4 w-[22px] rounded-[3px] object-cover shrink-0"
      />
      <span className={cn(
        "text-xs font-semibold truncate flex-1 leading-none",
        isWinner ? "text-primary" : "text-foreground",
      )}>
        {short}
      </span>
      {showScore && (
        <span className={cn(
          "text-sm font-black tabular-nums shrink-0 w-4 text-right",
          isWinner ? "text-primary" : "text-muted-foreground",
        )}>
          {score ?? 0}
        </span>
      )}
    </div>
  );
}

function TBDRow() {
  return (
    <div className="flex items-center gap-2 px-2.5 flex-1">
      <div className="h-4 w-[22px] rounded-[3px] bg-muted/30 shrink-0" />
      <span className="text-[10px] text-muted-foreground/35 font-medium tracking-wide">TBD</span>
    </div>
  );
}
