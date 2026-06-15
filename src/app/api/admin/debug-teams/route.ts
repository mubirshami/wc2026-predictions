import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://worldcup26.ir/get/games", { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: `worldcup26.ir ${res.status}` }, { status: 502 });
  }
  const data = await res.json();
  const games = (data.games ?? []).slice(0, 10).map((g: Record<string, string>) => ({
    home: g.home_team_name_en,
    away: g.away_team_name_en,
    finished: g.finished,
    time_elapsed: g.time_elapsed,
    home_score: g.home_score,
    away_score: g.away_score,
  }));
  return NextResponse.json({ total: data.games?.length, sample: games });
}
