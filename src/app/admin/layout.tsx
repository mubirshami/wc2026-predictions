import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ShieldCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <div className="mx-auto w-full max-w-5xl px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Admin Area</span>
        </div>
        {children}
      </div>
    </div>
  );
}
