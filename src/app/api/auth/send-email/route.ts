import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
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
  const headers = Object.fromEntries(request.headers);

  // Verify Supabase StandardWebhooks signature
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (secret) {
    try {
      const wh = new Webhook(secret);
      wh.verify(rawBody, headers);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const payload: EmailPayload = JSON.parse(rawBody);
    const { user, email_data } = payload;
    const { token_hash, email_action_type, redirect_to, site_url } = email_data;

    // Build the Supabase verification URL
    const base = site_url.replace(/\/$/, "");
    const confirmationUrl = `${base}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

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
