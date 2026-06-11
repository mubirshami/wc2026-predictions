import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchAllGames } from "@/lib/worldcup26";

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
    // Fetch all games from worldcup26.ir and build a lookup by team names
    const games = await fetchAllGames();
    const gameMap = new Map<string, (typeof games)[0]>();
    for (const game of games) {
      const key = `${game.home_team.toLowerCase()}|${game.away_team.toLowerCase()}`;
      gameMap.set(key, game);
    }

    // Fetch all DB matches that still need updating
    const { data: dbMatches, error: dbError } = await supabase
      .from("matches")
      .select("id, home_team, away_team, status, home_score, away_score")
      .in("status", ["upcoming", "live"]);

    if (dbError) throw new Error(dbError.message);

    for (const dbMatch of dbMatches ?? []) {
      const key = `${dbMatch.home_team.toLowerCase()}|${dbMatch.away_team.toLowerCase()}`;
      const game = gameMap.get(key);

      if (!game) continue; // not in worldcup26 data yet — skip

      const updatePayload: Record<string, unknown> = {
        status: game.status,
        result_source: "api",
        live_minute: game.live_minute,
        home_scorers: game.home_scorers,
        away_scorers: game.away_scorers,
      };

      // Only update scores when the API provides them
      if (game.home_score !== null) {
        updatePayload.home_score = game.home_score;
        updatePayload.away_score = game.away_score;
      }

      // Set winner when completed
      if (game.status === "completed" && game.home_score !== null && game.away_score !== null) {
        if (game.home_score > game.away_score) {
          updatePayload.winner = "home";
        } else if (game.away_score > game.home_score) {
          updatePayload.winner = "away";
        } else {
          updatePayload.winner = "draw";
        }
        updatePayload.scores_calculated = false;
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
