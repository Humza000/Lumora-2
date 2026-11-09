import type { NextConfig } from "next";

// Cache Components is intentionally OFF: almost every portal/admin route reads the
// session cookie and the database per request. See CLAUDE.md ("Rendering model").
const nextConfig: NextConfig = {
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
