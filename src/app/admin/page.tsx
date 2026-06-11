import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminMatchesTable } from "@/components/admin/admin-matches-table";
import { SyncFixturesButton } from "@/components/admin/sync-fixtures-button";
import { SyncScoresButton } from "@/components/admin/sync-scores-button";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage match scores and trigger score calculations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncScoresButton />
          <SyncFixturesButton />
        </div>
      </div>
      <AdminMatchesTable matches={matches ?? []} />
    </div>
  );
}
