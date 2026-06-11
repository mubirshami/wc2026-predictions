"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Lock, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import { cn, isMatchLocked, isMatchDayOpen, getLockTimeDisplay, getStageLabel, formatMatchDate, formatMatchTime } from "@/lib/utils";
import { getTeamFlagUrl } from "@/lib/constants/teams";
import { savePrediction } from "@/app/actions/predictions";
import type { MatchWithPrediction, PredictionOption } from "@/types";

interface MatchCardProps {
  match: MatchWithPrediction;
}

export function MatchCard({ match }: MatchCardProps) {
  const [pending, startTransition] = useTransition();
  const [optimisticPrediction, setOptimisticPrediction] = useState<PredictionOption | null | undefined>(
    match.user_prediction?.predicted_winner ?? null
  );

  const locked = isMatchLocked(match.kickoff_at);
  const dayOpen = isMatchDayOpen(match.kickoff_at);
  const currentPrediction = optimisticPrediction ?? match.user_prediction?.predicted_winner ?? null;
  const pointsAwarded = match.user_prediction?.points_awarded;
  const isGroup = match.stage === "group";

  const homeFlagUrl = getTeamFlagUrl(match.home_team);
  const awayFlagUrl = getTeamFlagUrl(match.away_team);

  function handlePredict(option: PredictionOption) {
    if (!dayOpen || locked || pending) return;
    const prev = optimisticPrediction;
    setOptimisticPrediction(option);
    startTransition(async () => {
      const result = await savePrediction(match.id, option);
      if (!result.success) {
        setOptimisticPrediction(prev);
        toast.error(result.error ?? "Failed to save prediction");
      }
    });
  }

  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const isUpcoming = match.status === "upcoming";

  return (
    <div className={cn(
      "rounded-2xl border bg-card overflow-hidden transition-all duration-200 flex flex-col h-full",
      isLive
        ? "border-emerald-500/40 shadow-lg shadow-emerald-500/10"
        : "border-border/60 hover:border-border"
    )}>
      {/* Card header */}
      <div className={cn(
        "px-4 py-2.5 flex items-center justify-between text-xs border-b border-border/40",
        isLive ? "bg-emerald-500/10" : "bg-muted/30"
      )}>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="live-indicator">●</span> LIVE
            </span>
          ) : isCompleted ? (
            <span className="font-semibold text-muted-foreground">Full Time</span>
          ) : (
            <span className="text-muted-foreground font-medium">
              {getStageLabel(match.stage)}
              {match.group_name ? ` · Group ${match.group_name}` : ""}
            </span>
          )}
        </div>
        <div className="text-right text-muted-foreground">
          {formatMatchDate(match.kickoff_at)} · {formatMatchTime(match.kickoff_at)}
        </div>
      </div>

      {/* Teams */}
      <div className="px-5 py-5 flex-1">
        <div className="flex items-center gap-3">
          {/* Home team */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <TeamFlag url={homeFlagUrl} name={match.home_team} />
            <span className="text-sm font-bold text-foreground text-center leading-tight">
              {match.home_team}
            </span>
          </div>

          {/* Score / vs */}
          <div className="shrink-0 flex flex-col items-center gap-1 px-2">
            {isUpcoming ? (
              <span className="text-xl font-light text-muted-foreground/60">vs</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-3xl font-black tabular-nums w-8 text-center",
                  isCompleted && match.winner === "home" ? "text-emerald-400" : "text-foreground"
                )}>
                  {match.home_score ?? 0}
                </span>
                <span className="text-lg text-muted-foreground/50 font-light">–</span>
                <span className={cn(
                  "text-3xl font-black tabular-nums w-8 text-center",
                  isCompleted && match.winner === "away" ? "text-emerald-400" : "text-foreground"
                )}>
                  {match.away_score ?? 0}
                </span>
              </div>
            )}
            {isCompleted && match.winner === "draw" && (
              <span className="text-[10px] text-emerald-400 font-semibold">DRAW</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <TeamFlag url={awayFlagUrl} name={match.away_team} />
            <span className="text-sm font-bold text-foreground text-center leading-tight">
              {match.away_team}
            </span>
          </div>
        </div>
      </div>

      {/* Prediction section */}
      <div className="px-4 pb-4 space-y-2">
        {isUpcoming && !dayOpen && (
          <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3 shrink-0" />
            <span>Opens {formatMatchDate(match.kickoff_at)}</span>
          </div>
        )}

        {isUpcoming && dayOpen && !locked && (
          <>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: isGroup ? "1fr auto 1fr" : "1fr 1fr" }}>
              <PredictButton
                selected={currentPrediction === "home"}
                onClick={() => handlePredict("home")}
                disabled={pending}
              >
                {homeFlagUrl && <img src={homeFlagUrl} alt={match.home_team} className="w-5 h-auto rounded-sm shrink-0" />}
                <span className="text-xs font-semibold truncate">{shortName(match.home_team)}</span>
              </PredictButton>

              {isGroup && (
                <PredictButton
                  selected={currentPrediction === "draw"}
                  onClick={() => handlePredict("draw")}
                  disabled={pending}
                  className="px-3"
                >
                  <span className="text-xs font-semibold">Draw</span>
                </PredictButton>
              )}

              <PredictButton
                selected={currentPrediction === "away"}
                onClick={() => handlePredict("away")}
                disabled={pending}
              >
                {awayFlagUrl && <img src={awayFlagUrl} alt={match.away_team} className="w-5 h-auto rounded-sm shrink-0" />}
                <span className="text-xs font-semibold truncate">{shortName(match.away_team)}</span>
              </PredictButton>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {currentPrediction ? "✓ Prediction saved · tap to change" : getLockTimeDisplay(match.kickoff_at)}
            </p>
          </>
        )}

        {isUpcoming && dayOpen && locked && (
          <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 shrink-0" />
            <span>
              {currentPrediction
                ? `Locked · ${predictionText(currentPrediction, match)}`
                : "Locked · no prediction made"}
            </span>
          </div>
        )}

        {isLive && (
          <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 shrink-0" />
            <span>{currentPrediction ? predictionText(currentPrediction, match) : "No prediction made"}</span>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-1.5 text-xs">
              {currentPrediction ? (
                <>
                  {pointsAwarded != null ? (
                    pointsAwarded > 0
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      : <XCircle className="h-3.5 w-3.5 text-red-400/70 shrink-0" />
                  ) : null}
                  <span className="text-muted-foreground">{predictionText(currentPrediction, match)}</span>
                </>
              ) : (
                <span className="text-muted-foreground/60">No prediction</span>
              )}
            </div>
            {pointsAwarded != null && (
              <span className={cn(
                "text-sm font-bold",
                pointsAwarded > 0 ? "text-emerald-400" : "text-muted-foreground/50"
              )}>
                {pointsAwarded > 0 ? `+${pointsAwarded} pts` : "0 pts"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamFlag({ url, name }: { url: string; name: string }) {
  if (!url) {
    return (
      <div className="w-16 h-11 rounded-md bg-muted/50 border border-border/40 flex items-center justify-center text-xs text-muted-foreground font-bold shrink-0">
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      className="w-16 h-11 object-cover rounded-md shadow-sm border border-black/10"
    />
  );
}

function PredictButton({
  selected,
  onClick,
  disabled,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-sm transition-all duration-150",
        selected
          ? "bg-primary/15 border-primary text-primary font-semibold shadow-sm"
          : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function shortName(name: string): string {
  const overrides: Record<string, string> = {
    "United States": "USA",
    "Bosnia-Herzegovina": "Bosnia",
    "Trinidad and Tobago": "T&T",
    "Dominican Republic": "Dom. Rep.",
    "Central African Republic": "CAR",
    "Equatorial Guinea": "Eq. Guinea",
    "Papua New Guinea": "PNG",
    "New Zealand": "NZ",
    "Saudi Arabia": "KSA",
    "South Africa": "S. Africa",
    "South Korea": "Korea",
    "North Korea": "N. Korea",
    "Ivory Coast": "Côte d'Ivoire",
    "DR Congo": "DR Congo",
  };
  return overrides[name] ?? (name.length > 10 ? name.split(" ")[0] : name);
}

function predictionText(prediction: PredictionOption, match: MatchWithPrediction): string {
  if (prediction === "draw") return "Draw";
  const team = prediction === "home" ? match.home_team : match.away_team;
  return `${shortName(team)} win`;
}
