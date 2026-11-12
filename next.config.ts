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

// Local Next dev needs D1/R2 bindings, but does not run the generated cache Durable Objects.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev({ configPath: "./freebuff.dev.wrangler.jsonc" });
}

export default nextConfig;
