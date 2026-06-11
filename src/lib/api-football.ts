import type { APIFootballFixture, MatchStatus, PredictionOption } from "@/types";

const BASE_URL = "https://v3.football.api-sports.io";
const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

function getHeaders() {
  return {
    "x-rapidapi-key": process.env.API_FOOTBALL_KEY!,
    "x-rapidapi-host": "v3.football.api-sports.io",
  };
}

export async function fetchAllFixtures(): Promise<APIFootballFixture[]> {
  const res = await fetch(
    `${BASE_URL}/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
    { headers: getHeaders(), next: { revalidate: 0 } }
  );

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);

  const data = await res.json();
  return data.response ?? [];
}

export async function fetchLiveFixtures(): Promise<APIFootballFixture[]> {
  const res = await fetch(
    `${BASE_URL}/fixtures?live=all&league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
    { headers: getHeaders(), next: { revalidate: 0 } }
  );

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);

  const data = await res.json();
  return data.response ?? [];
}

export async function fetchRecentlyFinished(): Promise<APIFootballFixture[]> {
  const now = new Date();
  const from = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = now.toISOString().slice(0, 10);

  const res = await fetch(
    `${BASE_URL}/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&from=${fromStr}&to=${toStr}&status=FT-AET-PEN`,
    { headers: getHeaders(), next: { revalidate: 0 } }
  );

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);

  const data = await res.json();
  return data.response ?? [];
}

const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "INT", "SUSP"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

export function mapApiStatus(shortStatus: string): MatchStatus {
  if (LIVE_STATUSES.has(shortStatus)) return "live";
  if (FINISHED_STATUSES.has(shortStatus)) return "completed";
  return "upcoming";
}

export function determineWinner(
  fixture: APIFootballFixture
): PredictionOption | null {
  const { fixture: { status }, teams } = fixture;

  if (!FINISHED_STATUSES.has(status.short)) return null;

  if (teams.home.winner === true) return "home";
  if (teams.away.winner === true) return "away";
  // Both null at FT = draw (only possible in group stage)
  if (teams.home.winner === null && teams.away.winner === null) return "draw";

  return null;
}

export function parseRound(round: string): {
  stage: string;
  groupName: string | null;
} {
  const r = round.toLowerCase();
  if (r.includes("group")) {
    const match = round.match(/Group\s+([A-Z])/i);
    return { stage: "group", groupName: match?.[1]?.toUpperCase() ?? null };
  }
  if (r.includes("round of 32")) return { stage: "round_of_32", groupName: null };
  if (r.includes("round of 16")) return { stage: "round_of_16", groupName: null };
  if (r.includes("quarter")) return { stage: "quarter_final", groupName: null };
  if (r.includes("semi")) return { stage: "semi_final", groupName: null };
  if (r.includes("3rd") || r.includes("third")) return { stage: "third_place", groupName: null };
  if (r.includes("final")) return { stage: "final", groupName: null };
  return { stage: "group", groupName: null };
}
