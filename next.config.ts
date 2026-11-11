import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Lets the cloud preview hostname load the dev server (development only).
  allowedDevOrigins: ["pv-8192aa67dabc-41acba7a-fc9e-4845-bec4-f40eb253b689.style.dev"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  experimental: {
    serverActions: {
      // Studio photographs are uploaded through a server action.
      bodySizeLimit: "24mb",
    },
  },
};

// Provides the local D1/R2 bindings from freebuff.wrangler.jsonc while running `next dev`.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev({ configPath: "./freebuff.wrangler.jsonc" });
}

export default nextConfig;
