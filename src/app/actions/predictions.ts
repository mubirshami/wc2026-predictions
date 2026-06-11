"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PredictionOption } from "@/types";

export async function savePrediction(
  matchId: string,
  predictedWinner: PredictionOption
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Fetch match to validate timing and stage
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("kickoff_at, stage, status")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return { success: false, error: "Match not found" };
  }

  // Enforce: predictions open 24 hours before kickoff
  const openAt = new Date(match.kickoff_at).getTime() - 24 * 60 * 60 * 1000;
  if (Date.now() < openAt) {
    return { success: false, error: "Predictions for this match are not open yet" };
  }

  // Enforce lock: 15 minutes before kickoff
  const lockTime = new Date(match.kickoff_at).getTime() - 15 * 60 * 1000;
  if (Date.now() >= lockTime) {
    return { success: false, error: "Predictions are locked for this match" };
  }

  // Enforce: no draw option in knockout stages
  if (match.stage !== "group" && predictedWinner === "draw") {
    return {
      success: false,
      error: "Draw is not a valid prediction for knockout matches",
    };
  }

  // Upsert prediction (insert or update)
  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      predicted_winner: predictedWinner,
      points_awarded: null,
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
