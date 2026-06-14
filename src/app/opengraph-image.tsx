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
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={320}
          height={320}
          style={{ objectFit: "contain" }}
          alt="FIFA World Cup 2026"
        />
        <span
          style={{
            fontSize: "52px",
            fontWeight: 800,
            color: "#ffffff",
            marginTop: "32px",
            letterSpacing: "-0.02em",
          }}
        >
          Scor<span style={{ color: "#10b981" }}>acle</span>
        </span>
        <span
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.45)",
            marginTop: "12px",
            letterSpacing: "0.02em",
          }}
        >
          FIFA World Cup 2026 Prediction League
        </span>
      </div>
    ),
    { ...size }
  );
}
