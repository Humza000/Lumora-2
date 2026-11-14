export type EmailProvider = "smtp" | "resend" | "console";

/**
 * Which delivery method is configured: Gmail/any SMTP, Resend, or console (dev fallback).
 * `EMAIL_TRANSPORT=console` forces the console fallback outside production (used by Playwright,
 * so test runs never send real email and can read links from the dev log).
 */
export function resolveEmailProvider(env: Record<string, string | undefined>): EmailProvider {
  if (env.NODE_ENV !== "production" && env.EMAIL_TRANSPORT === "console") return "console";
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) return "smtp";
  if (env.RESEND_API_KEY) return "resend";
  return "console";
}
