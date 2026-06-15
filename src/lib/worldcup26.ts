const BASE_URL = "https://worldcup26.ir/get/games";

// worldcup26.ir names → names used in our DB (seeded from football-data.org)
const NAME_MAP: Record<string, string> = {
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "Cape Verde": "Cape Verde Islands",
  "Czech Republic": "Czechia",
  "Democratic Republic of the Congo": "Congo DR",
};

interface WC26ApiGame {
  _id: string;
  id: string;
  home_score: string;
  away_score: string;
  home_scorers: string | null;
  away_scorers: string | null;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en: string;
  away_team_name_en: string;
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
  winner: "home" | "away" | "draw" | null;
}

function parseScorers(raw: string | null): string[] {
  if (!raw || raw === "null") return [];
  try {
    const cleaned = raw.replace(/^\{/, "[").replace(/\}$/, "]");
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

function mapStatus(timeElapsed: string, finished: string): "upcoming" | "live" | "completed" {
  if (finished === "TRUE" || timeElapsed === "finished") return "completed";
  if (timeElapsed === "notstarted") return "upcoming";
  return "live";
}

function getLiveMinute(timeElapsed: string): number | null {
  const nonMinute = ["finished", "notstarted", "live", "halftime", "firsthalf", "secondhalf", "extratime", "penaltyshootout"];
  if (nonMinute.includes(timeElapsed)) return null;
  const n = parseInt(timeElapsed, 10);
  return isNaN(n) ? null : n;
}

function normalizeName(name: string): string {
  return NAME_MAP[name] ?? name;
}

function determineWinner(home: number, away: number, type: string): "home" | "away" | "draw" | null {
  if (home > away) return "home";
  if (away > home) return "away";
  if (type === "group") return "draw";
  return null;
}

export async function fetchAllGames(): Promise<WC26Game[]> {
  const res = await fetch(BASE_URL, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`worldcup26.ir ${res.status}: ${await res.text()}`);
  const data: { games: WC26ApiGame[] } = await res.json();

  return (data.games ?? [])
    .filter((g) => g.home_team_name_en && g.away_team_name_en)
    .map((g) => {
      const status = mapStatus(g.time_elapsed, g.finished);
      const homeScore = parseInt(g.home_score, 10);
      const awayScore = parseInt(g.away_score, 10);
      const hasScore = status !== "upcoming" && !isNaN(homeScore) && !isNaN(awayScore);

      return {
        id: g.id,
        home_team: normalizeName(g.home_team_name_en),
        away_team: normalizeName(g.away_team_name_en),
        home_score: hasScore ? homeScore : null,
        away_score: hasScore ? awayScore : null,
        home_scorers: parseScorers(g.home_scorers),
        away_scorers: parseScorers(g.away_scorers),
        status,
        live_minute: getLiveMinute(g.time_elapsed),
        live_period: g.time_elapsed === "halftime" ? "HT" : null,
        winner: status === "completed" && hasScore ? determineWinner(homeScore, awayScore, g.type) : null,
      };
    });
}
