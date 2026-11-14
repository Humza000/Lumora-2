import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { appUrl, site } from "./site";
import { formatGBP } from "./money";
import { resolveEmailProvider, type EmailProvider } from "./email-provider";

// Transactional email. Delivery, in order of preference:
//   1. SMTP (e.g. Gmail with an App Password): SMTP_HOST/PORT/USER/PASS
//   2. Resend: RESEND_API_KEY (needs a verified sending domain)
//   3. Neither set: emails are printed to the server log and NOT sent (dev only).

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f8f7ff;font-family:Arial,Helvetica,sans-serif;color:#17152b">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:36px;border:1px solid #e4defc">
  <tr><td><p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;letter-spacing:6px;color:#7c3aed;margin:0 0 28px">${esc(site.name.toUpperCase())}</p>
  <h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>
  <div style="font-size:15px;line-height:1.6">${body}</div>
  ${cta ? `<p style="margin:28px 0"><a href="${cta.href}" style="background:#17152b;color:#f8f7ff;padding:12px 22px;border-radius:10px;text-decoration:none;display:inline-block">${esc(cta.label)}</a></p><p style="font-size:12px;color:#666">Or paste this link into your browser:<br>${cta.href}</p>` : ""}
  </td></tr></table></td></tr></table></body></html>`;
}

/** Which delivery method is configured: Gmail/any SMTP, Resend, or console (dev fallback). */
export function emailProvider(): EmailProvider {
  return resolveEmailProvider(process.env);
}

let smtp: Transporter | null = null;
function smtpTransport() {
  smtp ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return smtp;
}

/** Resolves to false when delivery failed (never throws), so callers can tell the user. */
async function send(to: string, subject: string, html: string): Promise<boolean> {
  const provider = emailProvider();
  if (provider === "console") {
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    console.warn(
      `\n[email:dev] NOT SENT (no SMTP_* or RESEND_API_KEY configured)\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n[email:dev] Links: ${links.join(" ")}\n`,
    );
    return true;
  }
  // Gmail SMTP requires the From address to be the authenticated account.
  const from =
    process.env.EMAIL_FROM || (provider === "smtp" ? `${site.name} <${process.env.SMTP_USER}>` : `${site.name} <no-reply@lumoradesign.uk>`);
  try {
    if (provider === "smtp") {
      // Customer replies land in the main Lumora inbox.
      await smtpTransport().sendMail({ from, replyTo: site.email, to, subject, html });
    } else {
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from, replyTo: site.email, to, subject, html });
      if (error) throw new Error(`${error.name}: ${error.message}`);
    }
    return true;
  } catch (err) {
    // Email failure must never break the user-facing action, but must be visible in logs.
    console.error(`[email] send via ${provider} to ${to} failed:`, err);
    return false;
  }
}

export const emails = {
  verifyEmail(to: string, name: string, token: string, next?: string) {
    const href = appUrl(`/verify-email?token=${token}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    return send(
      to,
      `Verify your ${site.name} account`,
      layout(`Welcome, ${esc(name)}`, `<p>Please confirm your email address to finish setting up your account and start your quote.</p>`, {
        label: "Verify email",
        href,
      }),
    );
  },

  passwordReset(to: string, name: string, token: string) {
    const href = appUrl(`/reset-password?token=${token}`);
    return send(
      to,
      `Reset your ${site.name} password`,
      layout(
        `Hi ${esc(name)}`,
        `<p>We received a request to reset your password. This link works once and expires in 1 hour.</p><p>If you didn't ask for this, you can safely ignore this email.</p>`,
        { label: "Choose a new password", href },
      ),
    );
  },

  invite(to: string, name: string, token: string) {
    const href = appUrl(`/accept-invite?token=${token}`);
    return send(
      to,
      `You've been invited to the ${site.name} client portal`,
      layout(`Hi ${esc(name)}`, `<p>Your client portal is ready. Set a password to track your project's progress and manage invoices.</p>`, {
        label: "Set up my account",
        href,
      }),
    );
  },

  quoteReceived(to: string, name: string, min: number, max: number) {
    return send(
      to,
      `We've received your quote request`,
      layout(
        `Thanks, ${esc(name)}`,
        `<p>We've received your project details. Your indicative estimate is <strong>${formatGBP(min, { whole: true })} – ${formatGBP(max, { whole: true })}</strong>.</p><p>We'll review everything and get back to you within 2 working days with a tailored proposal.</p>`,
        { label: "View in your portal", href: appUrl("/portal/quotes") },
      ),
    );
  },

  adminNewQuote(quoteId: string, clientName: string, businessName: string) {
    const to = process.env.ADMIN_NOTIFY_EMAIL;
    if (!to) return Promise.resolve(true);
    return send(
      to,
      `New quote request: ${businessName}`,
      layout("New quote request", `<p>${esc(clientName)} (${esc(businessName)}) submitted a quote.</p>`, {
        label: "Review quote",
        href: appUrl(`/admin/quotes/${quoteId}`),
      }),
    );
  },

  invoiceSent(to: string, name: string, invoiceId: string, number: string, total: number, dueDate: Date) {
    return send(
      to,
      `Invoice ${number} from ${site.name}`,
      layout(
        `Invoice ${esc(number)}`,
        `<p>Hi ${esc(name)},</p><p>A new invoice for <strong>${formatGBP(total)}</strong> is ready, due on ${dueDate.toLocaleDateString("en-GB")}.</p>`,
        { label: "View & pay invoice", href: appUrl(`/portal/invoices/${invoiceId}`) },
      ),
    );
  },
};
