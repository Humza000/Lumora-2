import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/site";

const PRIVATE = ["/admin", "/portal", "/quote", "/api", "/login", "/signup", "/check-email", "/verify-email", "/forgot-password", "/reset-password", "/accept-invite"];

// AI search / answer-engine crawlers are welcomed explicitly (GEO), with the same private paths blocked.
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended", "Bingbot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: ["/", "/llms.txt"], disallow: PRIVATE },
    ],
    sitemap: appUrl("/sitemap.xml"),
    host: appUrl(),
  };
}
