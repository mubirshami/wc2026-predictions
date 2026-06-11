-- Add live match data columns for worldcup26.ir integration
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_scorers TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS away_scorers TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS live_minute  INTEGER DEFAULT NULL;
