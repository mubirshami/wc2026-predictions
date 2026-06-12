"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveSubscription(subscriptionJson: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const sub = JSON.parse(subscriptionJson);

  await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      subscription: sub,
    },
    { onConflict: "endpoint" }
  );
}
