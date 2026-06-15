const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

// ESPN display names → names used in our DB (seeded from football-data.org)
const NAME_MAP: Record<string, string> = {
  "Türkiye": "Turkey",
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "Cape Verde": "Cape Verde Islands",
  "Czech Republic": "Czechia",
  "DR Congo": "Congo DR",
  "Congo, DR": "Congo DR",
  "United States of America": "United States",
  "Korea Republic": "South Korea",
  "IR Iran": "Iran",
};

interface ESPNStatusType {
  state: "pre" | "in" | "post";
  name: string;
  completed: boolean;
}

interface ESPNStatus {
  type: ESPNStatusType;
  displayClock: string;
  period: number;
}

interface ESPNTeam {
  id: string;
  displayName: string;
}

interface ESPNCompetitor {
  homeAway: "home" | "away";
  team: ESPNTeam;
  score?: string;
}

interface ESPNDetail {
  type: { text: string };
  clock?: { displayValue: string };
  team?: { id: string };
  athletesInvolved?: Array<{ displayName: string }>;
}

interface ESPNCompetition {
  status: ESPNStatus;
  competitors: ESPNCompetitor[];
  details: ESPNDetail[];
}

interface ESPNEvent {
  id: string;
  season?: { slug?: string };
  competitions: ESPNCompetition[];
}

export interface ESPNGame {
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

function normalizeName(name: string): string {
  return NAME_MAP[name] ?? name;
}

function parseClock(displayClock: string): number | null {
  const match = displayClock.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function determineWinner(
  home: number,
  away: number,
  seasonSlug: string
): "home" | "away" | "draw" | null {
  if (home > away) return "home";
  if (away > home) return "away";
  if (seasonSlug === "group-stage") return "draw";
  return null; // knockout draw — needs manual override
}

function mapEvent(event: ESPNEvent): ESPNGame | null {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const statusType = comp.status.type;
  const state = statusType.state;

  const homeComp = comp.competitors.find((c) => c.homeAway === "home");
  const awayComp = comp.competitors.find((c) => c.homeAway === "away");
  if (!homeComp || !awayComp) return null;

  const homeTeam = normalizeName(homeComp.team.displayName);
  const awayTeam = normalizeName(awayComp.team.displayName);

  const status: "upcoming" | "live" | "completed" =
    state === "post" ? "completed" : state === "in" ? "live" : "upcoming";

  const homeScore =
    status !== "upcoming" && homeComp.score != null
      ? parseInt(homeComp.score, 10)
      : null;
  const awayScore =
    status !== "upcoming" && awayComp.score != null
      ? parseInt(awayComp.score, 10)
      : null;

  const isHalftime = statusType.name === "STATUS_HALFTIME";
  const liveMinute =
    !isHalftime && status === "live"
      ? parseClock(comp.status.displayClock)
      : null;

  // Build scorer lists from goal details
  const homeId = homeComp.team.id;
  const awayId = awayComp.team.id;
  const homeScorers: string[] = [];
  const awayScorers: string[] = [];

  for (const detail of comp.details ?? []) {
    if (detail.type.text !== "Goal" && detail.type.text !== "Penalty") continue;
    const scorer = detail.athletesInvolved?.[0]?.displayName;
    if (!scorer) continue;
    if (detail.team?.id === homeId) homeScorers.push(scorer);
    else if (detail.team?.id === awayId) awayScorers.push(scorer);
  }

  const seasonSlug = event.season?.slug ?? "group-stage";
  const winner =
    status === "completed" && homeScore !== null && awayScore !== null
      ? determineWinner(homeScore, awayScore, seasonSlug)
      : null;

  return {
    id: event.id,
    home_team: homeTeam,
    away_team: awayTeam,
    home_score: homeScore,
    away_score: awayScore,
    home_scorers: homeScorers,
    away_scorers: awayScorers,
    status,
    live_minute: liveMinute,
    live_period: isHalftime ? "HT" : null,
    winner,
  };
}

function getDateStr(daysOffset = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export async function fetchESPNGames(): Promise<ESPNGame[]> {
  // Fetch yesterday + today to catch matches that may still be "live" in DB from the previous day
  const dates = [getDateStr(-1), getDateStr(0)];
  const seen = new Set<string>();
  const games: ESPNGame[] = [];

  for (const date of dates) {
    const res = await fetch(`${BASE_URL}?dates=${date}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`ESPN API ${res.status}: ${await res.text()}`);
    const data: { events?: ESPNEvent[] } = await res.json();

    for (const event of data.events ?? []) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      const game = mapEvent(event);
      if (game) games.push(game);
    }
  }

  return games;
}
