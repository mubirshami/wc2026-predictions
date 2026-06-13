import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTeamFlagUrl } from "@/lib/constants/teams";
import { formatMatchDate, getStageLabel } from "@/lib/utils";
import { User, Target, Trophy, Percent } from "lucide-react";
import type { MatchStage } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardEntry } from "@/types";
import { NotificationToggle } from "@/components/notification-toggle";

export const revalidate = 60;

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.username) redirect("/complete-profile");

  // Get leaderboard entry for this user
  const { data: lbEntry } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("id", user.id)
    .single();

  const stats = lbEntry as LeaderboardEntry | null;

  // Prediction history with match details
  const { data: predictions } = await supabase
    .from("predictions")
    .select(
      `
      *,
      matches (
        id, home_team, away_team, home_team_code, away_team_code,
        kickoff_at, stage, group_name, status, home_score, away_score, winner
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary overflow-hidden shrink-0">
          {profile.favorite_team ? (
            <Image
              src={getTeamFlagUrl(profile.favorite_team)}
              alt={profile.favorite_team}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">⚽</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          {profile.favorite_team && (
            <p className="text-muted-foreground">
              Supports{" "}
              <span className="text-foreground">{profile.favorite_team}</span>
            </p>
          )}
          {stats?.rank && (
            <p className="text-sm text-muted-foreground">
              Rank{" "}
              <span className="font-semibold text-primary">#{stats.rank}</span>
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Trophy className="h-4 w-4 text-accent" />}
          label="Total Points"
          value={stats?.total_points ?? 0}
          highlight
        />
        <StatCard
          icon={<Target className="h-4 w-4 text-primary" />}
          label="Correct"
          value={stats?.correct_predictions ?? 0}
        />
        <StatCard
          icon={<User className="h-4 w-4 text-muted-foreground" />}
          label="Predicted"
          value={stats?.total_predictions ?? 0}
        />
        <StatCard
          icon={<Percent className="h-4 w-4 text-muted-foreground" />}
          label="Accuracy"
          value={`${stats?.accuracy ?? 0}%`}
        />
      </div>

      {/* Settings */}
      <NotificationToggle />

      {/* Prediction history */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Prediction History</h2>
        {!predictions || predictions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No predictions yet. Start predicting match outcomes!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {predictions.map((pred) => {
              const match = pred.matches as {
                home_team: string; away_team: string;
                home_team_code: string; away_team_code: string;
                kickoff_at: string; stage: string; group_name: string | null;
                status: string; home_score: number | null; away_score: number | null;
                winner: string | null;
              } | null;

              if (!match) return null;

              const predLabel =
                pred.predicted_winner === "home"
                  ? `${match.home_team_code} Win`
                  : pred.predicted_winner === "away"
                  ? `${match.away_team_code} Win`
                  : "Draw";

              return (
                <Card key={pred.id} className="border-border/50">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {match.home_team} vs {match.away_team}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatMatchDate(match.kickoff_at)} ·{" "}
                          {getStageLabel(match.stage as MatchStage)}
                          {match.group_name && ` · Group ${match.group_name}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            match.status === "live"
                              ? "live"
                              : match.status === "completed"
                              ? "completed"
                              : "upcoming"
                          }
                          className="text-xs"
                        >
                          {match.status === "completed" &&
                          match.home_score !== null
                            ? `${match.home_score}–${match.away_score}`
                            : match.status === "live"
                            ? "LIVE"
                            : "Upcoming"}
                        </Badge>

                        <span className="text-xs text-muted-foreground">
                          {predLabel}
                        </span>

                        {pred.points_awarded !== null && (
                          <span
                            className={
                              pred.points_awarded > 0
                                ? "text-sm font-bold text-emerald-400"
                                : "text-sm text-muted-foreground"
                            }
                          >
                            {pred.points_awarded > 0
                              ? `+${pred.points_awarded}`
                              : "0"}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/30" : ""}>
      <CardHeader className="pb-1 pt-4 px-4">
        <div className="flex items-center gap-1.5">
          {icon}
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4 px-4">
        <div
          className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
