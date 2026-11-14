import { describe, expect, it } from "vitest";
import { resolveEmailProvider } from "../email-provider";

const smtp = { SMTP_HOST: "smtp.gmail.com", SMTP_USER: "a@b.c", SMTP_PASS: "x" };

describe("resolveEmailProvider", () => {
  it("falls back to console when nothing is configured", () => {
    expect(resolveEmailProvider({})).toBe("console");
    expect(resolveEmailProvider({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: "a@b.c", SMTP_PASS: "" })).toBe("console");
  });

  it("prefers SMTP over Resend", () => {
    expect(resolveEmailProvider({ ...smtp, RESEND_API_KEY: "re_1" })).toBe("smtp");
    expect(resolveEmailProvider({ RESEND_API_KEY: "re_1" })).toBe("resend");
  });

  it("honours EMAIL_TRANSPORT=console outside production only", () => {
    expect(resolveEmailProvider({ ...smtp, EMAIL_TRANSPORT: "console", NODE_ENV: "development" })).toBe("console");
    expect(resolveEmailProvider({ ...smtp, EMAIL_TRANSPORT: "console", NODE_ENV: "production" })).toBe("smtp");
  });
});
