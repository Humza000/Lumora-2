import "server-only";
import { headers } from "next/headers";

// Simple fixed-window in-memory limiter. Good enough for a single instance / dev.
// TODO(production): swap for a shared store (e.g. Upstash Redis) on serverless.
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimit(name: string, limit: number, windowMs: number) {
  // Escape hatch for repeated local E2E runs. Ignored in production builds.
  if (process.env.NODE_ENV !== "production" && process.env.DISABLE_RATE_LIMIT === "true") return { ok: true };
  const key = `${name}:${await clientIp()}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  bucket.count += 1;
  return { ok: bucket.count <= limit };
}
