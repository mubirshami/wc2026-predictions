-- Knockout stage scoring: correct = +5, wrong = -10
-- Group stage unchanged: correct = +5, wrong = 0

CREATE OR REPLACE FUNCTION calculate_match_scores(p_match_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_winner TEXT;
  v_stage  TEXT;
  v_correct INTEGER;
  v_wrong   INTEGER;
  v_rows_updated INTEGER;
BEGIN
  SELECT winner, stage INTO v_winner, v_stage FROM matches WHERE id = p_match_id;

  IF v_winner IS NULL THEN
    RETURN 0;
  END IF;

  IF v_stage = 'group' THEN
    v_correct := 5;
    v_wrong   := 0;
  ELSE
    -- All knockout stages (round_of_32, round_of_16, quarter_final, semi_final, third_place, final)
    v_correct := 5;
    v_wrong   := -10;
  END IF;

  UPDATE predictions
  SET
    points_awarded = CASE
      WHEN predicted_winner = v_winner THEN v_correct
      ELSE v_wrong
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
