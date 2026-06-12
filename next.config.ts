import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "media.api-sports.io" },
    ],
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  // Prevent SW from caching the manifest — Chrome fetches it directly and
  // getting cached HTML instead of JSON causes a "Syntax error" parse failure
  publicExcludes: ["!manifest.webmanifest", "!favicon.ico"],
  customWorkerSrc: "worker",
})(nextConfig);
