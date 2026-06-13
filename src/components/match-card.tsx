"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Lock, CheckCircle2, XCircle, CalendarClock, Loader2, Clock } from "lucide-react";
import { cn, isMatchLocked, isMatchDayOpen, getPredictionOpenTime, getStageLabel, formatMatchDate, formatMatchTime, getLocksIn } from "@/lib/utils";
import { getTeamFlagUrl } from "@/lib/constants/teams";
import { savePrediction } from "@/app/actions/predictions";
import type { MatchWithPrediction, PredictionOption } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MatchCardProps {
  match: MatchWithPrediction;
}

export function MatchCard({ match }: MatchCardProps) {
  const [pending, startTransition] = useTransition();
  const [optimisticPrediction, setOptimisticPrediction] = useState<PredictionOption | null | undefined>(
    match.user_prediction?.predicted_winner ?? null
  );
  const [pendingConfirm, setPendingConfirm] = useState<PredictionOption | null>(null);

  const locked = isMatchLocked(match.kickoff_at);
  const dayOpen = isMatchDayOpen(match.kickoff_at);
  const currentPrediction = optimisticPrediction ?? match.user_prediction?.predicted_winner ?? null;
  const pointsAwarded = match.user_prediction?.points_awarded;
  const isGroup = match.stage === "group";
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const isUpcoming = match.status === "upcoming";

  const isCorrect = !!currentPrediction && !!match.winner && currentPrediction === match.winner;
  const isWrong = !!currentPrediction && !!match.winner && currentPrediction !== match.winner;

  // Tick every 30s to keep lock countdown fresh
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (!isUpcoming || !dayOpen || locked) return;
    const timer = setInterval(() => forceUpdate((n) => n + 1), 30_000);
    return () => clearInterval(timer);
  }, [isUpcoming, dayOpen, locked]);

  const homeFlagUrl = getTeamFlagUrl(match.home_team);
  const awayFlagUrl = getTeamFlagUrl(match.away_team);

  function requestPredict(option: PredictionOption) {
    if (!dayOpen || locked || pending) return;
    setPendingConfirm(option);
  }

  function confirmPredict() {
    if (!pendingConfirm) return;
    const option = pendingConfirm;
    const prev = optimisticPrediction;
    setOptimisticPrediction(option);
    startTransition(async () => {
      const result = await savePrediction(match.id, option);
      if (!result.success) {
        setOptimisticPrediction(prev);
        toast.error(result.error ?? "Failed to save prediction");
      } else {
        toast.success(currentPrediction ? "Prediction updated!" : "Prediction saved!");
      }
      setPendingConfirm(null); // close dialog only after action completes
    });
  }

  return (
    <div className={cn(
      "group relative rounded-2xl border overflow-hidden flex flex-col h-full transition-all duration-200",
      isLive
        ? "border-primary/40 bg-card shadow-lg shadow-primary/8"
        : "border-border/60 bg-card hover:border-border hover:shadow-md hover:shadow-black/10"
    )}>
      {/* Live glow strip */}
      {isLive && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}

      {/* Header */}
      <div className={cn(
        "px-4 py-2.5 flex items-center justify-between text-xs border-b border-border/30",
        isLive ? "bg-primary/8" : "bg-muted/20"
      )}>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 font-bold text-primary text-xs uppercase tracking-wide">
              <span className="live-indicator h-1.5 w-1.5 rounded-full bg-primary" />
              {match.live_period === "HT" ? "Half Time" : `Live${match.live_minute ? ` · ${match.live_minute}'` : ""}`}
            </span>
          ) : isCompleted ? (
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Full Time</span>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {getStageLabel(match.stage)}
              {match.group_name ? ` · Group ${match.group_name}` : ""}
            </span>
          )}
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatMatchDate(match.kickoff_at)} · {formatMatchTime(match.kickoff_at)}
        </span>
      </div>

      {/* Teams */}
      <div className="px-4 py-5 flex-1">
        <div className="flex items-center gap-2">

          {/* Home */}
          <div className={cn(
            "flex-1 flex flex-col items-center gap-2.5 min-w-0 transition-opacity duration-200",
            isCompleted && match.winner === "away" && "opacity-40"
          )}>
            <div className={cn(
              "relative rounded-xl overflow-hidden shadow-sm ring-2 ring-transparent transition-all duration-200",
              isCompleted && match.winner === "home" && "ring-primary/50 shadow-primary/20 shadow-md",
              currentPrediction === "home" && isUpcoming && "ring-primary/60"
            )}>
              <TeamFlag url={homeFlagUrl} name={match.home_team} />
            </div>
            <span className="text-sm font-semibold text-center leading-tight line-clamp-2">
              {match.home_team}
            </span>
            <ScorersList scorers={match.home_scorers} />
          </div>

          {/* Score / VS */}
          <div className="shrink-0 flex flex-col items-center gap-1 px-1">
            {isUpcoming ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg font-light text-muted-foreground tracking-widest">vs</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-3xl font-black tabular-nums w-8 text-center leading-none",
                  isCompleted && match.winner === "home" ? "text-primary" : "text-foreground"
                )}>
                  {match.home_score ?? 0}
                </span>
                <span className="text-muted-foreground font-light text-xl">—</span>
                <span className={cn(
                  "text-3xl font-black tabular-nums w-8 text-center leading-none",
                  isCompleted && match.winner === "away" ? "text-primary" : "text-foreground"
                )}>
                  {match.away_score ?? 0}
                </span>
              </div>
            )}
            {isCompleted && match.winner === "draw" && (
              <span className="text-[10px] font-bold text-accent tracking-wide uppercase">Draw</span>
            )}
          </div>

          {/* Away */}
          <div className={cn(
            "flex-1 flex flex-col items-center gap-2.5 min-w-0 transition-opacity duration-200",
            isCompleted && match.winner === "home" && "opacity-40"
          )}>
            <div className={cn(
              "relative rounded-xl overflow-hidden shadow-sm ring-2 ring-transparent transition-all duration-200",
              isCompleted && match.winner === "away" && "ring-primary/50 shadow-primary/20 shadow-md",
              currentPrediction === "away" && isUpcoming && "ring-primary/60"
            )}>
              <TeamFlag url={awayFlagUrl} name={match.away_team} />
            </div>
            <span className="text-sm font-semibold text-center leading-tight line-clamp-2">
              {match.away_team}
            </span>
            <ScorersList scorers={match.away_scorers} />
          </div>
        </div>
      </div>

      {/* Prediction section */}
      <div className="px-3 pb-3">

        {/* Future day — not open yet */}
        {isUpcoming && !dayOpen && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground bg-muted/40 rounded-xl">
            <CalendarClock className="h-4 w-4 shrink-0" />
            <span>
              Opens {formatMatchDate(getPredictionOpenTime(match.kickoff_at).toISOString())} · {formatMatchTime(getPredictionOpenTime(match.kickoff_at).toISOString())}
            </span>
          </div>
        )}

        {/* Today — predict buttons */}
        {isUpcoming && dayOpen && !locked && (
          <div className="space-y-2">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: isGroup ? "1fr auto 1fr" : "1fr 1fr" }}>
              <PredictButton
                selected={currentPrediction === "home"}
                onClick={() => requestPredict("home")}
                disabled={pending}
              >
                {homeFlagUrl && <Image src={homeFlagUrl} alt={match.home_team} width={20} height={14} className="w-5 h-3.5 object-cover rounded-sm shrink-0" />}
                <span className="text-sm font-semibold truncate">{shortName(match.home_team)}</span>
              </PredictButton>

              {isGroup && (
                <PredictButton
                  selected={currentPrediction === "draw"}
                  onClick={() => requestPredict("draw")}
                  disabled={pending}
                  className="px-3"
                >
                  <span className="text-sm font-semibold">Draw</span>
                </PredictButton>
              )}

              <PredictButton
                selected={currentPrediction === "away"}
                onClick={() => requestPredict("away")}
                disabled={pending}
              >
                {awayFlagUrl && <Image src={awayFlagUrl} alt={match.away_team} width={20} height={14} className="w-5 h-3.5 object-cover rounded-sm shrink-0" />}
                <span className="text-sm font-semibold truncate">{shortName(match.away_team)}</span>
              </PredictButton>
            </div>
            <p className="text-sm text-center flex items-center justify-center gap-1 text-amber-400/90 font-medium">
              <Clock className="h-3 w-3 shrink-0" />
              {currentPrediction ? `Tap to change · ${getLocksIn(match.kickoff_at)}` : getLocksIn(match.kickoff_at)}
            </p>
          </div>
        )}

        {/* Locked */}
        {isUpcoming && dayOpen && locked && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground bg-muted/30 rounded-xl">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              {currentPrediction ? predictionText(currentPrediction, match) : "No prediction made"}
            </span>
          </div>
        )}

        {/* Live */}
        {isLive && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-sm bg-primary/8 rounded-xl">
            <Lock className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              {currentPrediction ? predictionText(currentPrediction, match) : "No prediction made"}
            </span>
          </div>
        )}

        {/* Completed */}
        {isCompleted && (
          <div className={cn(
            "flex items-center justify-between px-3 py-2.5 rounded-xl",
            isCorrect ? "bg-emerald-500/10" : isWrong ? "bg-destructive/8" : "bg-muted/30"
          )}>
            <div className="flex items-center gap-1.5">
              {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
              {isWrong && <XCircle className="h-4 w-4 text-destructive/50 shrink-0" />}
              <span className={cn(
                "text-sm font-medium",
                isCorrect ? "text-emerald-400" : isWrong ? "text-muted-foreground" : "text-muted-foreground/50"
              )}>
                {isCorrect
                  ? "Correct prediction"
                  : isWrong
                  ? predictionText(currentPrediction!, match)
                  : "No prediction"}
              </span>
            </div>
            {(isCorrect || isWrong) && pointsAwarded != null && (
              <span className={cn(
                "text-sm font-bold tabular-nums",
                pointsAwarded > 0 ? "text-emerald-400" : "text-muted-foreground/40"
              )}>
                {pointsAwarded > 0 ? `+${pointsAwarded}` : "0"} pts
              </span>
            )}
          </div>
        )}
      </div>

      {/* Prediction confirmation dialog */}
      <Dialog open={!!pendingConfirm} onOpenChange={(open) => { if (!open) setPendingConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {currentPrediction ? "Change prediction?" : "Confirm prediction"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              {match.home_team} <span className="text-muted-foreground/50">vs</span> {match.away_team}
            </p>

            {currentPrediction && pendingConfirm !== currentPrediction && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground line-through">{predictionLabel(currentPrediction, match)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold text-foreground">{predictionLabel(pendingConfirm!, match)}</span>
              </div>
            )}

            {(!currentPrediction || pendingConfirm === currentPrediction) && (
              <p className="text-sm font-semibold">
                {pendingConfirm ? predictionLabel(pendingConfirm, match) : ""}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPendingConfirm(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={confirmPredict} disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {currentPrediction ? "Change" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamFlag({ url, name }: { url: string; name: string }) {
  if (!url) {
    return (
      <div className="w-16 h-11 bg-muted/50 flex items-center justify-center text-xs text-muted-foreground font-bold">
        {name.slice(0, 3).toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={name}
      width={64}
      height={44}
      className="w-16 h-11 object-cover"
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
        "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-sm transition-all duration-150 active:scale-95",
        selected
          ? "bg-primary/15 border-primary text-primary font-semibold"
          : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted/50",
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

function predictionLabel(prediction: PredictionOption, match: MatchWithPrediction): string {
  if (prediction === "draw") return "Draw";
  const team = prediction === "home" ? match.home_team : match.away_team;
  return `${team} to win`;
}

function ScorersList({ scorers }: { scorers: string[] | null | undefined }) {
  if (!scorers || scorers.length === 0) return null;
  return (
    <div className="flex flex-col items-center gap-0.5 w-full">
      {scorers.map((s, i) => (
        <span key={i} className="text-xs text-muted-foreground text-center leading-tight">
          ⚽ {s}
        </span>
      ))}
    </div>
  );
}
