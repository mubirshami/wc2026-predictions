import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
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

// Supabase auth hooks sign the body with HMAC-SHA256.
// Secret format from dashboard: "v1,whsec_<base64>"
async function verifyHookSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) return true; // no secret configured — allow all

  if (!signatureHeader) return false;

  // Strip the "v1,whsec_" prefix and base64-decode the key
  const keyBase64 = secret.replace(/^v\d+,whsec_/, "");
  const keyBytes = Buffer.from(keyBase64, "base64");

  // Signature header format: "v1=<hex>"
  const expectedHex = signatureHeader.replace(/^v\d+=/, "");
  const computed = createHmac("sha256", keyBytes).update(rawBody).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(expectedHex, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Verify Supabase HMAC signature
  const signature = request.headers.get("x-supabase-signature");
  const valid = await verifyHookSignature(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
