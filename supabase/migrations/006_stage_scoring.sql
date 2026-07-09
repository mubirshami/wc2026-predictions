-- Stage-specific scoring
-- Group:       correct +5,  wrong  0
-- R32 / R16:  correct +5,  wrong -10
-- QF / 3rd:   correct +10, wrong -20
-- SF:          correct +20, wrong -30
-- Final:       correct +30, wrong -50

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

  CASE v_stage
    WHEN 'group' THEN
      v_correct := 5;  v_wrong := 0;
    WHEN 'round_of_32', 'round_of_16' THEN
      v_correct := 5;  v_wrong := -10;
    WHEN 'quarter_final', 'third_place' THEN
      v_correct := 10; v_wrong := -20;
    WHEN 'semi_final' THEN
      v_correct := 20; v_wrong := -30;
    WHEN 'final' THEN
      v_correct := 30; v_wrong := -50;
    ELSE
      v_correct := 5;  v_wrong := 0;
  END CASE;

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
