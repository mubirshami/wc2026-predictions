import { Trophy } from "lucide-react";
import { siteConfig } from "@/lib/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh bg-background">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <div className="mb-5 flex flex-col items-center gap-2 animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Trophy className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight">{siteConfig.name}</h1>
            <p className="text-xs text-muted-foreground">{siteConfig.tagline}</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-[420px] animate-scale-in">
          {children}
        </div>

        <p className="mt-5 text-xs text-muted-foreground/60 text-center">
          {siteConfig.tournament}
        </p>
      </div>
    </div>
  );
}
