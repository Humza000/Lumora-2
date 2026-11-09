import "server-only";
import { Resend } from "resend";
import { appUrl, site } from "./site";
import { formatGBP } from "./money";

// Basic transactional email. If RESEND_API_KEY is unset (local dev), emails are
// logged to the server console instead so flows like verification still work.

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f8f8ff;font-family:Arial,Helvetica,sans-serif;color:#150a35">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:36px;border:1px solid #e7defc">
  <tr><td><p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;letter-spacing:6px;color:#7d4dff;margin:0 0 28px">${esc(site.name.toUpperCase())}</p>
  <h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>
  <div style="font-size:15px;line-height:1.6">${body}</div>
  ${cta ? `<p style="margin:28px 0"><a href="${cta.href}" style="background:#150a35;color:#f8f8ff;padding:12px 22px;border-radius:10px;text-decoration:none;display:inline-block">${esc(cta.label)}</a></p><p style="font-size:12px;color:#666">Or paste this link into your browser:<br>${cta.href}</p>` : ""}
  </td></tr></table></td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    console.info(`\n[email:dev] To: ${to}\n[email:dev] Subject: ${subject}\n[email:dev] Links: ${links.join(" ")}\n`);
    return;
  }
  try {
    await new Resend(key).emails.send({
      from: process.env.EMAIL_FROM ?? `${site.name} <no-reply@lumoradesign.uk>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Email failure must never break the user-facing action.
    console.error("[email] send failed", err);
  }
}

export const emails = {
  verifyEmail(to: string, name: string, token: string) {
    const href = appUrl(`/verify-email?token=${token}`);
    return send(
      to,
      `Verify your ${site.name} account`,
      layout(`Welcome, ${esc(name)}`, `<p>Please confirm your email address to finish setting up your account and start your quote.</p>`, {
        label: "Verify email",
        href,
      }),
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
    if (!to) return Promise.resolve();
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
