import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchAllGames } from "@/lib/worldcup26";
import { sendToUser } from "@/lib/notifications";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const synced: object[] = [];
  const errors: string[] = [];

  try {
    const games = await fetchAllGames();
    const gameById = new Map<string, (typeof games)[0]>();
    const gameByName = new Map<string, (typeof games)[0]>();
    for (const game of games) {
      gameById.set(game.id, game);
      gameByName.set(`${game.home_team.toLowerCase()}|${game.away_team.toLowerCase()}`, game);
    }

    const { data: dbMatches, error: dbError } = await supabase
      .from("matches")
      .select("id, api_football_id, home_team, away_team, status, home_score, away_score, kickoff_at, winner, reminder_sent, result_notification_sent")
      .in("status", ["upcoming", "live"]);

    if (dbError) throw new Error(dbError.message);

    const now = Date.now();

    for (const dbMatch of dbMatches ?? []) {
      // Prefer matching by API ID; fall back to team name for unlinked rows
      const game = (dbMatch.api_football_id ? gameById.get(String(dbMatch.api_football_id)) : undefined)
        ?? gameByName.get(`${dbMatch.home_team.toLowerCase()}|${dbMatch.away_team.toLowerCase()}`);

      if (!game) continue;

      const kickoffMs = new Date(dbMatch.kickoff_at).getTime();
      const hasStarted = kickoffMs <= now;

      // Never trust the API marking a match completed/live before kickoff
      const safeStatus =
        !hasStarted && (game.status === "completed" || game.status === "live")
          ? "upcoming"
          : game.status;

      const updatePayload: Record<string, unknown> = {
        status: safeStatus,
        result_source: "api",
        live_minute: game.live_minute,
        live_period: game.live_period,
        home_scorers: game.home_scorers,
        away_scorers: game.away_scorers,
      };

      if (game.home_score !== null) {
        updatePayload.home_score = game.home_score;
        updatePayload.away_score = game.away_score;
      }

      let justCompleted = false;
      if (game.status === "completed" && game.winner !== null && hasStarted) {
        updatePayload.winner = game.winner;
        updatePayload.scores_calculated = false;
        justCompleted = dbMatch.status !== "completed";
      }

      // ── Voting reminder: send 55–65 min before kickoff, once per match ──
      if (!dbMatch.reminder_sent && safeStatus === "upcoming") {
        const minsUntil = (kickoffMs - now) / 60000;
        if (minsUntil >= 55 && minsUntil <= 65) {
          // Find users who haven't predicted this match yet
          const { data: unpredicted } = await supabase
            .from("profiles")
            .select("id")
            .not("id", "in",
              supabase
                .from("predictions")
                .select("user_id")
                .eq("match_id", dbMatch.id)
            );

          if (unpredicted?.length) {
            await Promise.allSettled(
              unpredicted.map((p) =>
                sendToUser(supabase, p.id, {
                  title: "⚽ Voting closes in 1 hour",
                  body: `${dbMatch.home_team} vs ${dbMatch.away_team} — cast your prediction before it locks!`,
                  url: "/",
                  tag: `reminder-${dbMatch.id}`,
                })
              )
            );
          }
          updatePayload.reminder_sent = true;
        }
      }

      // ── Result notification: send once when match just completed ──
      if (justCompleted && !dbMatch.result_notification_sent) {
        const homeScore = game.home_score ?? 0;
        const awayScore = game.away_score ?? 0;
        const winner = game.winner!

        // Get all predictions for this match
        const { data: predictions } = await supabase
          .from("predictions")
          .select("user_id, predicted_winner")
          .eq("match_id", dbMatch.id);

        if (predictions?.length) {
          await Promise.allSettled(
            predictions.map((pred) => {
              const correct = pred.predicted_winner === winner;
              return sendToUser(supabase, pred.user_id, {
                title: correct ? "✅ Correct prediction! +5 pts" : "❌ Unlucky this time",
                body: `${dbMatch.home_team} ${homeScore}–${awayScore} ${dbMatch.away_team}`,
                url: "/",
                tag: `result-${dbMatch.id}`,
              });
            })
          );
        }
        updatePayload.result_notification_sent = true;
      }

      const { error } = await supabase
        .from("matches")
        .update(updatePayload)
        .eq("id", dbMatch.id);

      if (error) {
        errors.push(`[${dbMatch.home_team} vs ${dbMatch.away_team}] ${error.message}`);
      } else {
        synced.push({
          match: `${dbMatch.home_team} vs ${dbMatch.away_team}`,
          status: game.status,
          score: game.home_score !== null ? `${game.home_score} - ${game.away_score}` : "not started",
          minute: game.live_minute ?? "—",
          scorers: [...game.home_scorers, ...game.away_scorers],
        });
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      processed: (dbMatches ?? []).length,
      updated: synced.length,
      matches: synced,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Sync failed", detail: String(err) },
      { status: 500 }
    );
  }
}
