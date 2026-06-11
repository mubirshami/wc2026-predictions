import { createClient } from "@/lib/supabase/server";
import { getTeamFlagUrl } from "@/lib/constants/teams";
import { Trophy, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeaderboardEntry } from "@/types";

export const revalidate = 60;

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("leaderboard")
    .select("*")
    .limit(100);

  const leaderboard = (entries ?? []) as LeaderboardEntry[];
  const currentUserEntry = leaderboard.find((e) => e.id === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{leaderboard.length} players</span>
        </div>
      </div>

      {/* Current user rank card */}
      {currentUserEntry && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RankBadge rank={currentUserEntry.rank} />
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {currentUserEntry.favorite_team && (
                      <img src={getTeamFlagUrl(currentUserEntry.favorite_team)} alt={currentUserEntry.favorite_team} className="h-4 w-auto rounded-sm" />
                    )}
                    {currentUserEntry.username}
                    <span className="text-xs text-primary font-normal">(you)</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentUserEntry.correct_predictions} correct ·{" "}
                    {currentUserEntry.accuracy}% accuracy
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {currentUserEntry.total_points}
                </div>
                <div className="text-xs text-muted-foreground">pts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-accent" />
            Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No predictions made yet. Be the first!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Predictions</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Accuracy</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={entry.id === user?.id ? "bg-primary/5" : ""}
                  >
                    <TableCell className="text-center font-medium">
                      <RankBadge rank={entry.rank} inline />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.favorite_team && (
                          <img src={getTeamFlagUrl(entry.favorite_team)} alt={entry.favorite_team} className="h-5 w-auto rounded-sm shrink-0" />
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {entry.username}
                            {entry.id === user?.id && (
                              <span className="ml-1.5 text-[10px] text-primary">
                                you
                              </span>
                            )}
                          </div>
                          {entry.favorite_team && (
                            <div className="text-[10px] text-muted-foreground hidden sm:block">
                              {entry.favorite_team}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm hidden sm:table-cell">
                      {entry.correct_predictions}/{entry.total_predictions}
                    </TableCell>
                    <TableCell className="text-right text-sm hidden sm:table-cell">
                      {entry.accuracy}%
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {entry.total_points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RankBadge({ rank, inline = false }: { rank: number; inline?: boolean }) {
  if (rank === 1) {
    return <span className={inline ? "text-lg" : "text-2xl"}>🥇</span>;
  }
  if (rank === 2) {
    return <span className={inline ? "text-lg" : "text-2xl"}>🥈</span>;
  }
  if (rank === 3) {
    return <span className={inline ? "text-lg" : "text-2xl"}>🥉</span>;
  }
  return (
    <span className="text-sm font-semibold text-muted-foreground">{rank}</span>
  );
}
