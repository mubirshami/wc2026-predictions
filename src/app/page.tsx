import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BarChart2, Bell, Target, ChevronRight } from "lucide-react";
import { siteConfig } from "@/lib/config";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/matches");

  // Social proof stats
  const [{ count: playerCount }, { count: predictionCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).not("username", "is", null),
    supabase.from("predictions").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 font-bold">
            <Image src="/official-wc-logo.png" alt="WC 2026" width={36} height={36} className="rounded-sm" />
            <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Join free
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">

          {/* Tournament badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary tracking-wide">FIFA WORLD CUP 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            The whole world watches.<br />
            <span className="text-primary">Make your call.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            48 nations. 104 matches. One global leaderboard. Every kickoff shown in your local time — pick your winners before the whistle, earn points for every correct call, and find out if you&apos;ve got the sharpest football brain on the planet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              Start predicting free
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 rounded-xl border border-border/60 px-7 py-3.5 text-base font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Stats */}
          {((playerCount ?? 0) > 0) && (
            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <p className="text-2xl font-black text-foreground">{playerCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Players</p>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div>
                <p className="text-2xl font-black text-foreground">{predictionCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Predictions made</p>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div>
                <p className="text-2xl font-black text-foreground">104</p>
                <p className="text-xs text-muted-foreground mt-0.5">Matches</p>
              </div>
            </div>
          )}
        </section>

        {/* Features */}
        <section className="border-t border-border/30 bg-muted/10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid gap-6 sm:grid-cols-3">
              <FeatureCard
                icon={<Target className="h-5 w-5 text-primary" />}
                title="Back it before kickoff"
                description="Pick the winner for every match in your local time. Predictions lock 15 minutes before kickoff — call it right and the points are yours."
              />
              <FeatureCard
                icon={<BarChart2 className="h-5 w-5 text-primary" />}
                title="Compete against the world"
                description="One leaderboard, no borders. You're up against football fans from every corner of the planet. Every correct call counts, every position matters."
              />
              <FeatureCard
                icon={<Bell className="h-5 w-5 text-primary" />}
                title="Everything in one place"
                description="Live scores, local match times, your predictions, and your rank — all in a single app. No tabs, no spreadsheets, no guessing."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-4">The matches don&apos;t wait.</h2>
          <p className="text-muted-foreground mb-8">Join players from around the world. Free forever — no credit card, no catch.</p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
          >
            Create your free account
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 py-6 px-4 text-center">
        <p className="text-xs text-muted-foreground/50">
          Made with ❤️ for football fans everywhere · by{" "}
          <a
            href="https://www.linkedin.com/in/mubir-shami/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors underline underline-offset-2"
          >
            Mubir Shami
          </a>
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
