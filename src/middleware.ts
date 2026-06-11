import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/check-email");

  // reset-password is intentionally excluded from isAuthPage:
  // after clicking the reset link, the user has an active session and needs
  // to reach this page to set their new password.

  const isPublicApiRoute =
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/auth/send-email");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isAdminRoute = pathname.startsWith("/admin");
  const isCompleteProfile = pathname.startsWith("/complete-profile");

  // Always allow public API routes and auth callbacks
  if (isPublicApiRoute || isAuthCallback) {
    return supabaseResponse;
  }

  // Unauthenticated user trying to access protected page
  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Authenticated user trying to access auth pages
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user && !isAuthPage && !isCompleteProfile) {
    // Check if profile is complete
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.username) {
      return NextResponse.redirect(new URL("/complete-profile", request.url));
    }

    // Non-admin trying to access admin routes
    if (isAdminRoute && !profile?.is_admin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
