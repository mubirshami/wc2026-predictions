"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Trophy, LayoutGrid, Medal, BarChart2, User, LogOut, ShieldCheck, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { getTeamFlagUrl } from "@/lib/constants/teams";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/", label: "Matches", icon: LayoutGrid },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
  { href: "/standings", label: "Standings", icon: BarChart2 },
];

interface NavbarProps {
  profile: Profile;
}

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/sign-in");
    router.refresh();
  }

  const initials = profile.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl w-full items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary transition-transform group-hover:scale-105">
            <Trophy className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:block text-sm font-semibold tracking-tight">WC 2026 Predictions</span>
          <span className="block sm:hidden text-sm font-semibold">WC 2026</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:block">{label}</span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/60 transition-colors outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                {profile.username}
              </span>
              {profile.favorite_team && (
                <Image
                  src={getTeamFlagUrl(profile.favorite_team)}
                  alt={profile.favorite_team}
                  width={24}
                  height={16}
                  className="h-4 w-6 object-cover rounded-sm hidden sm:block"
                />
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2.5">
                  {profile.favorite_team && (
                    <Image
                      src={getTeamFlagUrl(profile.favorite_team)}
                      alt={profile.favorite_team}
                      width={44}
                      height={32}
                      className="h-8 w-11 object-cover rounded-md shrink-0"
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">{profile.username}</span>
                    {profile.favorite_team && (
                      <span className="text-xs text-muted-foreground font-normal truncate">
                        {profile.favorite_team}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>

              {profile.is_admin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
