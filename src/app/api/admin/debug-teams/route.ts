import { NextResponse } from "next/server";
import { fetchAllMatches } from "@/lib/football-data";

export async function GET() {
  const matches = await fetchAllMatches();

  const teams = new Map<string, string>();
  for (const m of matches) {
    if (m.homeTeam.name) teams.set(m.homeTeam.name, m.homeTeam.tla);
    if (m.awayTeam.name) teams.set(m.awayTeam.name, m.awayTeam.tla);
  }

  const sorted = [...teams.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, tla]) => ({ name, tla }));

  return NextResponse.json(sorted);
}
