import path from "node:path";
import type { NextConfig } from "next";

const apiOrigin = process.env.API_ORIGIN?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    instantInsights: {
      // Every route here renders its own data client-side against the Kiri Task
      // API, so per-user content is never part of a static shell. Automatic
      // validation would flag every authenticated segment; opt in explicitly
      // instead with `export const instant = ...` where it is worth measuring.
      validationLevel: 'manual-warning',
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Pin the workspace root so Turbopack ignores unrelated lockfiles above this folder.
    root: path.resolve(import.meta.dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // In production the browser uses /api on the web-app domain. Next proxies
  // that path to the separate Express project, so authentication cookies stay
  // first-party and work consistently in modern browsers.
  async rewrites() {
    if (!apiOrigin) return [];
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
