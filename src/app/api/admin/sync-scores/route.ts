import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  fetchLiveAndRecentMatches,
  mapFDStatus,
  mapFDWinner,
} from "@/lib/football-data";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let updated = 0;
  const errors: string[] = [];

  try {
    const matches = await fetchLiveAndRecentMatches();

    for (const match of matches) {
      const newStatus = mapFDStatus(match.status);
      const newWinner = mapFDWinner(match);

      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        home_score: match.score.fullTime.home,
        away_score: match.score.fullTime.away,
        result_source: "api",
      };

      if (newWinner) {
        updatePayload.winner = newWinner;
        updatePayload.scores_calculated = false;
      }

      const { error } = await serviceClient
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
