import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { Linkedin, MessageSquarePlus } from "lucide-react";

export default async function MainLayout({
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

  if (!profile?.username) redirect("/complete-profile");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border/20 py-4 px-4">
        <div className="mx-auto max-w-7xl flex items-center justify-center">
          <p className="text-sm text-muted-foreground/70">
            Developed with ❤️ for the game by{" "}
            <a
              href="https://www.linkedin.com/in/mubir-shami/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors font-medium inline-flex items-center gap-1"
            >
              Mubir Shami
              <Linkedin className="h-3 w-3" />
            </a>
          </p>
        </div>
      </footer>

      {/* Floating feedback button */}
      <a
        href="https://tally.so/r/lb4abX"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Feedback
      </a>
    </div>
  );
}
