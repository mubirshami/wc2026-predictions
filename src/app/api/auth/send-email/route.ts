import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  confirmSignupHtml,
  resetPasswordHtml,
  magicLinkHtml,
} from "@/lib/emails/templates";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

async function verifySupabaseSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  // Header format: "v1,whsec_<base64secret>" → extract the base64 part
  const keyB64 = secret.replace(/^v1,whsec_/, "");
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);

  // Supabase sends "v1=<hex-signature>"
  const sigHex = signatureHeader.replace(/^v1=/, "");
  const sigBytes = Uint8Array.from(sigHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));

  const bodyBytes = new TextEncoder().encode(rawBody);
  return crypto.subtle.verify("HMAC", cryptoKey, sigBytes, bodyBytes);
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const signature = request.headers.get("x-supabase-signature");
  const valid = await verifySupabaseSignature(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload: EmailPayload = JSON.parse(rawBody);
    const { user, email_data } = payload;
    const { token_hash, email_action_type, redirect_to } = email_data;

    const appBase = redirect_to.replace(/\/auth\/callback.*$/, "");
    const confirmationUrl = `${appBase}/auth/callback?token_hash=${token_hash}&type=${email_action_type}`;

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

    await transporter.sendMail({
      from: `Scoracle <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-email] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
