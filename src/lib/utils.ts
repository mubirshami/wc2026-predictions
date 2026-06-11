import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import type { MatchStage, MatchStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKickoffTime(utcTime: string): string {
  const date = new Date(utcTime);
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function formatMatchDate(utcTime: string): string {
  return format(new Date(utcTime), "EEE, MMM d");
}

export function formatMatchTime(utcTime: string): string {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(utcTime));
}

export function formatTimeUntil(utcTime: string): string {
  return formatDistanceToNow(new Date(utcTime), { addSuffix: true });
}

export function isMatchLocked(kickoffAt: string): boolean {
  const lockTime = new Date(kickoffAt).getTime() - 15 * 60 * 1000;
  return Date.now() >= lockTime;
}

export function isMatchDayOpen(kickoffAt: string): boolean {
  const matchDay = kickoffAt.slice(0, 10); // YYYY-MM-DD UTC
  const today = new Date().toISOString().slice(0, 10);
  return matchDay <= today;
}

export function getLockTimeDisplay(kickoffAt: string): string {
  const lockTime = new Date(new Date(kickoffAt).getTime() - 15 * 60 * 1000);
  if (isPast(lockTime)) return "Locked";
  if (isFuture(lockTime)) return `Locks ${formatDistanceToNow(lockTime, { addSuffix: true })}`;
  return "Locking soon";
}

export const stageLabelMap: Record<MatchStage, string> = {
  group: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-Final",
  semi_final: "Semi-Final",
  third_place: "3rd Place",
  final: "Final",
};

export function getStageLabel(stage: MatchStage): string {
  return stageLabelMap[stage] ?? stage;
}

export function getStatusColor(status: MatchStatus): string {
  switch (status) {
    case "live":
      return "bg-red-500 text-white";
    case "completed":
      return "bg-slate-600 text-slate-200";
    default:
      return "bg-emerald-700 text-emerald-100";
  }
}

export function getStatusLabel(status: MatchStatus): string {
  switch (status) {
    case "live":
      return "LIVE";
    case "completed":
      return "FT";
    default:
      return "Upcoming";
  }
}
