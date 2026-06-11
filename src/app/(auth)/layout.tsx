import { Trophy } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">WC 2026</h1>
          <p className="text-sm text-muted-foreground">Prediction League</p>
        </div>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-[420px]">{children}</div>

      <p className="mt-8 text-xs text-muted-foreground">
        FIFA World Cup 2026 &mdash; June 11 – July 19, 2026
      </p>
    </div>
  );
}
