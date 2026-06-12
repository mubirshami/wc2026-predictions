-- ============================================================
-- FIFA World Cup 2026 Prediction League - Database Schema
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  favorite_team TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_football_id INTEGER UNIQUE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_code TEXT NOT NULL,
  away_team_code TEXT NOT NULL,
  kickoff_at TIMESTAMPTZ NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'group', 'round_of_32', 'round_of_16',
    'quarter_final', 'semi_final', 'third_place', 'final'
  )),
  group_name TEXT,
  venue TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  home_score INTEGER,
  away_score INTEGER,
  winner TEXT CHECK (winner IN ('home', 'away', 'draw')),
  result_source TEXT CHECK (result_source IN ('api', 'manual')),
  scores_calculated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner TEXT NOT NULL CHECK (predicted_winner IN ('home', 'away', 'draw')),
  points_awarded INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_api_id ON matches(api_football_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);

-- ============================================================
-- LEADERBOARD VIEW
-- ============================================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id,
  p.username,
  p.favorite_team,
  COALESCE(SUM(pr.points_awarded), 0)::INTEGER AS total_points,
  COUNT(pr.id)::INTEGER AS total_predictions,
  COUNT(CASE WHEN pr.points_awarded > 0 THEN 1 END)::INTEGER AS correct_predictions,
  CASE
    WHEN COUNT(pr.id) > 0
    THEN ROUND(
      (COUNT(CASE WHEN pr.points_awarded > 0 THEN 1 END)::DECIMAL / COUNT(pr.id)) * 100, 1
    )
    ELSE 0
  END AS accuracy,
  RANK() OVER (
    ORDER BY
      COALESCE(SUM(pr.points_awarded), 0) DESC,
      COALESCE(
        COUNT(CASE WHEN pr.points_awarded > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(pr.id), 0),
        0
      ) DESC,
      p.username ASC
  )::INTEGER AS rank
FROM profiles p
LEFT JOIN predictions pr ON p.id = pr.user_id AND pr.points_awarded IS NOT NULL
WHERE p.username IS NOT NULL
GROUP BY p.id, p.username, p.favorite_team
ORDER BY total_points DESC, accuracy DESC, p.username ASC;

-- Grant view access to authenticated users and anon role
GRANT SELECT ON leaderboard TO anon, authenticated;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile shell when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate points for all predictions on a completed match
CREATE OR REPLACE FUNCTION calculate_match_scores(p_match_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_winner TEXT;
  v_rows_updated INTEGER;
BEGIN
  SELECT winner INTO v_winner FROM matches WHERE id = p_match_id;

  IF v_winner IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE predictions
  SET
    points_awarded = CASE
      WHEN predicted_winner = v_winner THEN 5
      ELSE 0
    END,
    updated_at = NOW()
  WHERE match_id = p_match_id
    AND points_awarded IS NULL;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  UPDATE matches
  SET scores_calculated = TRUE, updated_at = NOW()
  WHERE id = p_match_id;

  RETURN v_rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger handler: fire score calculation when winner is set
CREATE OR REPLACE FUNCTION handle_match_winner_set()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.winner IS NOT NULL
    AND (OLD.winner IS NULL OR OLD.winner <> NEW.winner)
    AND NOT NEW.scores_calculated
  THEN
    PERFORM calculate_match_scores(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at auto-update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_match_winner_set ON matches;
CREATE TRIGGER on_match_winner_set
  AFTER UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION handle_match_winner_set();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_matches_updated_at ON matches;
CREATE TRIGGER set_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_predictions_updated_at ON predictions;
CREATE TRIGGER set_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Matches policies (public read, admin write)
CREATE POLICY "matches_select_all" ON matches
  FOR SELECT USING (TRUE);

CREATE POLICY "matches_admin_insert" ON matches
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "matches_admin_update" ON matches
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "matches_admin_delete" ON matches
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Predictions policies
CREATE POLICY "predictions_select_all" ON predictions
  FOR SELECT USING (TRUE);

-- Insert: authenticated, own user_id, before lock time
CREATE POLICY "predictions_insert_own_unlocked" ON predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND NOW() < (
      SELECT kickoff_at - INTERVAL '15 minutes'
      FROM matches WHERE id = match_id
    )
  );

-- Update: authenticated, own user_id, before lock time
CREATE POLICY "predictions_update_own_unlocked" ON predictions
  FOR UPDATE USING (
    auth.uid() = user_id
    AND NOW() < (
      SELECT kickoff_at - INTERVAL '15 minutes'
      FROM matches WHERE id = match_id
    )
  );

-- Admins can update predictions (for manual scoring corrections)
CREATE POLICY "predictions_admin_update" ON predictions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
