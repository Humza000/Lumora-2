import "dotenv/config";
import { defineConfig } from "@playwright/test";

// E2E tests run against a seeded dev database (see README → Testing).
// Uses the locally installed Google Chrome, so no browser download is needed.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    // Emails are read from this log; rate limits are relaxed for repeated runs (dev only).
    command: "DISABLE_RATE_LIMIT=true npm run dev > .e2e-dev.log 2>&1",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
