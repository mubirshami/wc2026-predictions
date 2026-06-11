import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchLiveAndRecentMatches,
  mapFDStatus,
  mapFDScore,
  mapFDWinner,
} from "@/lib/football-data";

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

  if (!process.env.FOOTBALL_DATA_KEY) {
    return NextResponse.json({ error: "FOOTBALL_DATA_KEY not configured" }, { status: 503 });
  }

  let updated = 0;
  const errors: string[] = [];

  try {
    const matches = await fetchLiveAndRecentMatches();

    for (const match of matches) {
      const newStatus = mapFDStatus(match.status);
      const newWinner = mapFDWinner(match);

      const score = mapFDScore(match);
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        home_score: score.home,
        away_score: score.away,
        result_source: "api",
      };

      if (newWinner) {
        updatePayload.winner = newWinner;
        updatePayload.scores_calculated = false;
      }

      const { error } = await supabase
        .from("matches")
        .update(updatePayload)
        .eq("api_football_id", match.id);

      if (error) {
        errors.push(`Match ${match.id}: ${error.message}`);
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: matches.length,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Sync failed", detail: String(err) },
      { status: 500 }
    );
  }
}
