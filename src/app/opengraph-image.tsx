import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import path from "path";

export const alt = "Scoracle — FIFA World Cup 2026 Prediction League";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const logoData = readFileSync(path.join(process.cwd(), "public/official-wc-logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, #000000 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
          }}
        />

        {/* Top label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "999px",
            padding: "6px 20px",
            marginBottom: "32px",
          }}
        >
          <span style={{ fontSize: "14px", color: "#10b981", fontWeight: 600, letterSpacing: "0.05em" }}>
            FIFA World Cup 2026 · USA, Canada &amp; Mexico
          </span>
        </div>

        {/* Logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px", marginBottom: "20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            width={130}
            height={130}
            style={{ objectFit: "contain" }}
            alt="FIFA World Cup 2026"
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "64px",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Scor
            </span>
            <span
              style={{
                fontSize: "64px",
                fontWeight: 800,
                color: "#10b981",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              acle
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: "26px",
            color: "rgba(255,255,255,0.55)",
            fontWeight: 400,
            margin: "0 0 48px 0",
            textAlign: "center",
            letterSpacing: "0.01em",
          }}
        >
          Predict match outcomes · Climb the leaderboard · Win bragging rights
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "16px" }}>
          {["⚽ Match Predictions", "📊 Live Leaderboard", "🔔 Live Notifications"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "10px 20px",
                fontSize: "16px",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
