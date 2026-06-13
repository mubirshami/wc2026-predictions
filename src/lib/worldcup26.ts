const BASE_URL = "https://api.football-data.org/v4";

const HEADERS = () => ({ "X-Auth-Token": process.env.FOOTBALL_DATA_KEY ?? "" });

interface FDTeam {
  id: number;
  name: string;
}

interface FDMatch {
  id: number;
  status: string;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime: { home: number | null; away: number | null };
  };
  minute?: number;
}

interface FDResponse {
  matches: FDMatch[];
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
  live_period: "HT" | null;
}

function mapStatus(status: string): "upcoming" | "live" | "completed" {
  if (status === "FINISHED" || status === "AWARDED") return "completed";
  if (status === "IN_PLAY" || status === "PAUSED") return "live";
  return "upcoming";
}

function transform(m: FDMatch): WC26Game {
  const status = mapStatus(m.status);
  return {
    id: String(m.id),
    home_team: m.homeTeam.name,
    away_team: m.awayTeam.name,
    home_score: status !== "upcoming" ? m.score.fullTime.home : null,
    away_score: status !== "upcoming" ? m.score.fullTime.away : null,
    home_scorers: [],
    away_scorers: [],
    status,
    live_minute: m.minute ?? null,
    live_period: m.status === "PAUSED" ? "HT" : null,
  };
}

async function fetchLiveMinute(matchId: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE_URL}/matches/${matchId}`, {
      headers: HEADERS(),
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const m: FDMatch = await res.json();
    return m.minute ?? null;
  } catch {
    return null;
  }
}

export async function fetchAllGames(): Promise<WC26Game[]> {
  const res = await fetch(`${BASE_URL}/competitions/WC/matches`, {
    headers: HEADERS(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  const data: FDResponse = await res.json();

  const games = (data.matches ?? [])
    .filter((m) => m.homeTeam.name && m.awayTeam.name)
    .map(transform);

  // For live matches, fetch individual details to get the current minute
  const liveGames = games.filter((g) => g.status === "live");
  if (liveGames.length > 0) {
    await Promise.allSettled(
      liveGames.map(async (game) => {
        const minute = await fetchLiveMinute(game.id);
        if (minute !== null) game.live_minute = minute;
      })
    );
  }

  return games;
}
