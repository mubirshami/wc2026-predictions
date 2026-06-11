import { createClient } from "@/lib/supabase/server";
import { MatchesView } from "@/components/matches-view";

export const revalidate = 30;

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

  const predictionMap = new Map(
    (predictions ?? []).map((p) => [p.match_id, p])
  );

  const matchesWithPredictions = (matches ?? []).map((m) => ({
    ...m,
    user_prediction: predictionMap.get(m.id) ?? null,
  }));

  return <MatchesView matches={matchesWithPredictions} />;
}
