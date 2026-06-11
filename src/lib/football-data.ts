const BASE_URL = "https://api.football-data.org/v4";

function getHeaders() {
  return { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY! };
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: { id: number; name: string; shortName: string; tla: string };
  awayTeam: { id: number; name: string; shortName: string; tla: string };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
    fullTime: { home: number | null; away: number | null };
  };
  venue: string | null;
}

async function fetchMatches(query: string): Promise<FDMatch[]> {
  const res = await fetch(`${BASE_URL}/competitions/WC/matches${query}`, {
    headers: getHeaders(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.matches ?? [];
}

export function fetchAllMatches() {
  return fetchMatches("");
}

export function fetchLiveAndRecentMatches() {
  const today = new Date().toISOString().slice(0, 10);
  return fetchMatches(`?dateFrom=${today}&dateTo=${today}`);
}

export function mapFDStatus(status: string): "upcoming" | "live" | "completed" {
  if (status === "IN_PLAY" || status === "PAUSED" || status === "HALF_TIME") return "live";
  if (status === "FINISHED" || status === "AWARDED") return "completed";
  return "upcoming";
}

export function mapFDStage(stage: string): string {
  switch (stage) {
    case "GROUP_STAGE":   return "group";
    case "ROUND_OF_32":   return "round_of_32";
    case "ROUND_OF_16":   return "round_of_16";
    case "QUARTER_FINALS": return "quarter_final";
    case "SEMI_FINALS":   return "semi_final";
    case "THIRD_PLACE":   return "third_place";
    case "FINAL":         return "final";
    default:              return "group";
  }
}

export function mapFDGroup(group: string | null): string | null {
  if (!group) return null;
  return group.replace("GROUP_", "");
}

export function mapFDWinner(match: FDMatch): "home" | "away" | "draw" | null {
  if (mapFDStatus(match.status) !== "completed") return null;
  if (match.score.winner === "HOME_TEAM") return "home";
  if (match.score.winner === "AWAY_TEAM") return "away";
  if (match.score.winner === "DRAW") return "draw";
  return null;
}
