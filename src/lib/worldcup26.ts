const BASE_URL = "https://worldcup26.ir";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (process.env.WORLDCUP_API_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.WORLDCUP_API_TOKEN}`;
  }
  return headers;
}

interface WC26RawGame {
  id: string;
  home_team_name_en: string;
  away_team_name_en: string;
  home_score: string;
  away_score: string;
  home_scorers: string;
  away_scorers: string;
  group: string | null;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
}

export interface WC26Game {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  home_scorers: string[];
  away_scorers: string[];
  status: "upcoming" | "live" | "completed";
  live_minute: number | null;
}

// Parses PostgreSQL array literal: {"J. Pulisic 23'","R. Weah 67'"} → ["J. Pulisic 23'", "R. Weah 67'"]
function parseScorers(raw: string): string[] {
  if (!raw || raw === "{}") return [];
  const inner = raw.replace(/^\{|\}$/g, "");
  if (!inner) return [];
  const results: string[] = [];
  const regex = /"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = regex.exec(inner)) !== null) {
    results.push(match[1].replace(/\\"/g, '"'));
  }
  return results;
}

function parseScore(s: string): number | null {
  if (!s && s !== "0") return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

function mapStatus(game: WC26RawGame): "upcoming" | "live" | "completed" {
  if (game.finished === "TRUE") return "completed";
  const te = (game.time_elapsed ?? "").toLowerCase();
  if (!te || te === "notstarted") return "upcoming";
  if (te === "finished") return "completed";
  // firsthalf | halftime | secondhalf | extratime | penaltyshootout | numeric minute
  return "live";
}

function mapMinute(game: WC26RawGame): number | null {
  const n = parseInt(game.time_elapsed, 10);
  return isNaN(n) ? null : n;
}

function transform(raw: WC26RawGame): WC26Game {
  const status = mapStatus(raw);
  return {
    id: raw.id,
    home_team: raw.home_team_name_en,
    away_team: raw.away_team_name_en,
    // Only set scores once the match has started
    home_score: status !== "upcoming" ? parseScore(raw.home_score) : null,
    away_score: status !== "upcoming" ? parseScore(raw.away_score) : null,
    home_scorers: parseScorers(raw.home_scorers ?? "{}"),
    away_scorers: parseScorers(raw.away_scorers ?? "{}"),
    status,
    live_minute: mapMinute(raw),
  };
}

export async function fetchAllGames(): Promise<WC26Game[]> {
  const res = await fetch(`${BASE_URL}/get/games`, {
    headers: getHeaders(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`worldcup26.ir ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.games ?? []).map(transform);
}
