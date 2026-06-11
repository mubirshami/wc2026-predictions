import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();
  let user = null;
  let error = null;

  if (token_hash && type) {
    // Email confirmation / magic link / password reset
    const result = await supabase.auth.verifyOtp({ type, token_hash });
    user = result.data.user;
    error = result.error;
  } else if (code) {
    // OAuth / PKCE code exchange
    const result = await supabase.auth.exchangeCodeForSession(code);
    user = result.data.user;
    error = result.error;
  }

  if (!error && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (!profile?.username) {
      return NextResponse.redirect(`${origin}/complete-profile`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
