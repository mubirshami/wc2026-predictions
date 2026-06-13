import Image from "next/image";
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
      <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-5">
        {/* Logo */}
        <div className="mb-4 flex flex-col items-center gap-2 animate-fade-in">
          <Image src="/official-wc-logo.png" alt="WC 2026" width={56} height={56} className="rounded-xl" />
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight">{siteConfig.name}</h1>
            <p className="text-xs text-muted-foreground">{siteConfig.tagline}</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-[420px] animate-scale-in">
          {children}
        </div>

      </div>
    </div>
  );
}
