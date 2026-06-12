import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  confirmSignupHtml,
  resetPasswordHtml,
  magicLinkHtml,
} from "@/lib/emails/templates";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailPayload {
  user: { id: string; email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const payload: EmailPayload = JSON.parse(rawBody);
    const { user, email_data } = payload;
    const { token_hash, email_action_type, redirect_to } = email_data;

    // Point confirmation links directly to our own callback with token_hash.
    // Supabase's /auth/v1/verify redirects back with ?code= which requires the PKCE
    // code-verifier stored in the original signup browser — users clicking from email
    // webviews (Gmail mobile, Outlook) don't have it and land on the login page instead.
    // verifyOtp(token_hash) is server-side and needs no client state at all.
    const appBase = redirect_to.replace(/\/auth\/callback.*$/, "");
    const confirmationUrl = `${appBase}/auth/callback?token_hash=${token_hash}&type=${email_action_type}`;

    // Pick template + subject
    let subject: string;
    let html: string;

    if (email_action_type === "recovery") {
      subject = "Reset your Scoracle password";
      html = resetPasswordHtml(confirmationUrl);
    } else if (email_action_type === "magiclink") {
      subject = "Your Scoracle sign-in link";
      html = magicLinkHtml(confirmationUrl);
    } else {
      subject = "Confirm your Scoracle account";
      html = confirmSignupHtml(confirmationUrl);
    }

    const from = process.env.RESEND_FROM_EMAIL ?? "Scoracle <onboarding@resend.dev>";

    const { error } = await resend.emails.send({ from, to: user.email, subject, html });

    if (error) {
      console.error("[send-email] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-email] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
