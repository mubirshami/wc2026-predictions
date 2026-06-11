import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  fetchAllMatches,
  mapFDStatus,
  mapFDStage,
  mapFDGroup,
  mapFDScore,
  mapFDWinner,
} from "@/lib/football-data";

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.FOOTBALL_DATA_KEY) {
    return NextResponse.json({ error: "FOOTBALL_DATA_KEY not configured" }, { status: 503 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const matches = await fetchAllMatches();

  if (!matches.length) {
    return NextResponse.json({ error: "No matches returned from API" }, { status: 502 });
  }

  const seeded = matches.filter((m) => m.homeTeam.name && m.awayTeam.name);

  const rows = seeded.map((m) => ({
    api_football_id: m.id,
    home_team: m.homeTeam.name,
    away_team: m.awayTeam.name,
    home_team_code: m.homeTeam.tla ?? m.homeTeam.name.slice(0, 3).toUpperCase(),
    away_team_code: m.awayTeam.tla ?? m.awayTeam.name.slice(0, 3).toUpperCase(),
    kickoff_at: m.utcDate,
    stage: mapFDStage(m.stage),
    group_name: mapFDGroup(m.group),
    venue: m.venue,
    city: null,
    status: mapFDStatus(m.status),
    home_score: mapFDScore(m).home,
    away_score: mapFDScore(m).away,
    winner: mapFDWinner(m),
    result_source: "api" as const,
  }));

  const { error, count } = await service
    .from("matches")
    .upsert(rows, { onConflict: "api_football_id", count: "exact" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    upserted: count ?? rows.length,
    skipped: matches.length - seeded.length,
  });
}
