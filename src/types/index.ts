export type MatchStatus = "upcoming" | "live" | "completed";

export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type PredictionOption = "home" | "away" | "draw";

export interface Match {
  id: string;
  api_football_id: number | null;
  home_team: string;
  away_team: string;
  home_team_code: string;
  away_team_code: string;
  kickoff_at: string;
  stage: MatchStage;
  group_name: string | null;
  venue: string | null;
  city: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  home_scorers: string[] | null;
  away_scorers: string[] | null;
  live_minute: number | null;
  live_period: "HT" | null;
  winner: PredictionOption | null;
  result_source: "api" | "manual" | null;
  scores_calculated: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  favorite_team: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_winner: PredictionOption;
  points_awarded: number | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  favorite_team: string | null;
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
  accuracy: number;
  rank: number;
}

export interface MatchWithPrediction extends Match {
  user_prediction?: Prediction | null;
}

export interface APIFootballFixture {
  fixture: {
    id: number;
    status: {
      short: string;
      elapsed: number | null;
    };
    date: string;
    venue: {
      name: string | null;
      city: string | null;
    };
  };
  league: {
    id: number;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}
