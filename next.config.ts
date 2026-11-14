import type { NextConfig } from "next";

// Cache Components is intentionally OFF: almost every portal/admin route reads the
// session cookie and the database per request. See CLAUDE.md ("Rendering model").
const nextConfig: NextConfig = {
  // Playwright runs its own dev server with NEXT_DIST_DIR=.next-e2e so it can run beside `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
