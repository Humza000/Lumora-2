import "dotenv/config";
import { defineConfig } from "@playwright/test";

// E2E tests run against a seeded dev database (see README → Testing).
// They use their own dev server on port 3100, never your `npm run dev` on 3000: that one may have
// real email configured, and the tests sign up throwaway addresses.
const PORT = 3100;
// Uses the locally installed Google Chrome, so no browser download is needed.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    // Emails are printed to this log (never sent) and read back by the tests; rate limits are relaxed for repeated runs (dev only).
    command: `DISABLE_RATE_LIMIT=true EMAIL_TRANSPORT=console APP_URL=http://localhost:${PORT} NEXT_DIST_DIR=.next-e2e npx next dev -p ${PORT} > .e2e-dev.log 2>&1`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
