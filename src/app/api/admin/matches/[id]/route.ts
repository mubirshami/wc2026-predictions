import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function determineWinner(
  homeScore: number,
  awayScore: number,
  stage: string
): "home" | "away" | "draw" | null {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  if (stage === "group") return "draw";
  return null; // Knockout draw — needs manual override
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { home_score, away_score, status, manual_winner } = body;

  // Fetch existing match for stage
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("stage, scores_calculated")
    .eq("id", id)
    .single();

  if (!existingMatch) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Determine winner
  let winner: string | null = null;

  if (manual_winner) {
    winner = manual_winner;
  } else if (
    status === "completed" &&
    home_score !== null &&
    away_score !== null
  ) {
    winner = determineWinner(home_score, away_score, existingMatch.stage);
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    status,
    result_source: "manual",
    updated_at: new Date().toISOString(),
  };

  if (home_score !== null && home_score !== undefined) {
    updatePayload.home_score = home_score;
  }
  if (away_score !== null && away_score !== undefined) {
    updatePayload.away_score = away_score;
  }
  if (winner !== null) {
    updatePayload.winner = winner;
    // Reset scores_calculated if winner is changing to allow recalculation
    updatePayload.scores_calculated = false;
  }

  const { data: updatedMatch, error } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ match: updatedMatch });
}
