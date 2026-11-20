import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { appUrl, site } from "./site";
import { formatGBP } from "./money";
import { resolveEmailProvider, type EmailProvider } from "./email-provider";
import { formatHosting, type Estimate } from "./pricing";

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

const longDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Notice to ADMIN_NOTIFY_EMAIL about a hosting plan. */
function admin(subject: string, body: string, planId: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return Promise.resolve(true);
  return send(to, subject, layout(subject, body, { label: "Open plan", href: appUrl(`/admin/hosting/${planId}`) }));
}

export const emails = {
  verifyEmail(to: string, name: string, token: string, next?: string) {
    const href = appUrl(`/verify-email?token=${token}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    return send(
      to,
      `Verify your ${site.name} account`,
      layout(`Welcome, ${esc(name)}`, `<p>Please confirm your email address to finish setting up your account.</p>`, {
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

  quoteReceived(to: string, name: string, estimate: Estimate) {
    const hosting = estimate.hostingPlan
      ? estimate.hostingPrice > 0
        ? `${esc(estimate.hostingPlan.label)}: <strong>${formatHosting(estimate)}</strong> (optional, separate from the build)`
        : "No hosting required"
      : "Not chosen";
    return send(
      to,
      `We've received your quote request`,
      layout(
        `Thanks, ${esc(name)}`,
        `<p>We've received your project details. Here's your indicative estimate:</p>
<p>One-time development: <strong>from ${formatGBP(estimate.oneTime, { whole: true })}</strong>${estimate.projectType ? ` (${esc(estimate.projectType.label)})` : ""}<br>Hosting & care: ${hosting}</p>
${estimate.customQuote ? "<p>Your requirements may need a custom quote.</p>" : ""}
<p>This is an indicative estimate. We'll review your requirements and confirm the final price before any work begins, usually within 2 working days.</p>`,
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

  /** Client: the confirmed quote is ready to accept or decline. */
  quoteOfferSent(to: string, name: string, quoteId: string, price: number, hosting: string | null, message: string | null) {
    return send(
      to,
      `Your quote from ${site.name} is ready`,
      layout(
        `Your quote is ready, ${esc(name)}`,
        `<p>We've reviewed your requirements and confirmed your quote.</p>
<p>Project price: <strong>${formatGBP(price)}</strong>${hosting ? `<br>Hosting & care: ${esc(hosting)}` : ""}</p>
${message ? `<p style="white-space:pre-line">${esc(message)}</p>` : ""}
<p>Open it in your portal to see the full details. You can <strong>accept</strong> it, <strong>request changes</strong> or decline.</p>
<p>When you accept, your project is set up and we email your website invoice; you choose to pay in full or a 50% deposit, and work starts once it's paid.${hosting && /\d/.test(hosting) ? " Hosting starts when your site goes live, renews automatically, and you can cancel it any time." : ""} Nothing is billed until you accept.</p>`,
        { label: "View your quote", href: appUrl(`/portal/quotes/${quoteId}`) },
      ),
    );
  },

  adminQuoteAccepted(quoteId: string, clientName: string, projectTitle: string, price: number, invoiceNumber: string | null) {
    const to = process.env.ADMIN_NOTIFY_EMAIL;
    if (!to) return Promise.resolve(true);
    return send(
      to,
      `Quote accepted: ${projectTitle}`,
      layout(
        "Quote accepted",
        `<p>${esc(clientName)} accepted the quote for <strong>${formatGBP(price)}</strong>. The project <strong>${esc(projectTitle)}</strong> has been created.</p>
<p>${invoiceNumber ? `Invoice ${esc(invoiceNumber)} was issued and emailed to them automatically. The project is waiting for payment and moves to Planning when it's paid.` : "No invoice was needed."}</p>`,
        { label: "Open quote", href: appUrl(`/admin/quotes/${quoteId}`) },
      ),
    );
  },

  adminQuoteChangesRequested(quoteId: string, clientName: string, note: string) {
    const to = process.env.ADMIN_NOTIFY_EMAIL;
    if (!to) return Promise.resolve(true);
    return send(
      to,
      `Changes requested by ${clientName}`,
      layout(
        "Quote changes requested",
        `<p>${esc(clientName)} edited their answers and asked for an updated quote:</p><p style="white-space:pre-line">${esc(note)}</p><p>Open the quote to see what they changed, then adjust it and send it again.</p>`,
        { label: "Open quote", href: appUrl(`/admin/quotes/${quoteId}`) },
      ),
    );
  },

  /** Client: the site is live and their hosting plan is ready to start. */
  hostingStarted(to: string, name: string, planName: string, domain: string) {
    return send(
      to,
      `Your website is live: start your ${planName} plan`,
      layout(
        `Your site is live, ${esc(name)}`,
        `<p><strong>${esc(domain)}</strong> has launched. The last step is to start your ${esc(planName)} plan.</p>
<p>Choose monthly or yearly and make your first payment by card. Your card is saved securely by Stripe, so the plan then renews automatically; there are no invoices to pay by hand. You can update your card or cancel from your portal at any time.</p>`,
        { label: "Start your plan", href: appUrl("/portal/hosting") },
      ),
    );
  },

  adminQuoteDeclined(quoteId: string, clientName: string, reason: string | null) {
    const to = process.env.ADMIN_NOTIFY_EMAIL;
    if (!to) return Promise.resolve(true);
    return send(
      to,
      `Quote declined by ${clientName}`,
      layout(
        "Quote declined",
        `<p>${esc(clientName)} declined the quote.</p>${reason ? `<p>Their reason:</p><p style="white-space:pre-line">${esc(reason)}</p>` : "<p>They didn't give a reason.</p>"}<p>You can change the quote and send it again.</p>`,
        { label: "Open quote", href: appUrl(`/admin/quotes/${quoteId}`) },
      ),
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

  /** Payment confirmation to the client, sent when Stripe confirms an invoice is paid. */
  invoicePaid(to: string, name: string, invoiceId: string, number: string, total: number) {
    return send(
      to,
      `Payment received: invoice ${number}`,
      layout(
        `Thank you, ${esc(name)}`,
        `<p>We've received your payment of <strong>${formatGBP(total)}</strong> for invoice ${esc(number)}. No further action is needed.</p><p>You can download a copy of the paid invoice from your portal at any time.</p>`,
        { label: "View invoice", href: appUrl(`/portal/invoices/${invoiceId}`) },
      ),
    );
  },

  /** Client confirmation that their hosting plan will end (they keep it until then). */
  hostingCancelled(to: string, name: string, planName: string, domain: string, endsOn: Date) {
    return send(
      to,
      `Your ${planName} plan has been cancelled`,
      layout(
        `Hi ${esc(name)}`,
        `<p>As requested, your ${esc(planName)} plan for <strong>${esc(domain)}</strong> has been cancelled. You won't be charged again.</p><p>Hosting and care continue until <strong>${longDate(endsOn)}</strong>, the end of the period you've already paid for. Changed your mind? You can keep your plan from your portal before then.</p>`,
        { label: "View your plan", href: appUrl("/portal/hosting") },
      ),
    );
  },

  /** Client: an automatic hosting payment failed. */
  hostingPaymentFailed(to: string, name: string, planName: string, domain: string, amount: number) {
    return send(
      to,
      `We couldn't take your hosting payment`,
      layout(
        `Hi ${esc(name)}`,
        `<p>Your ${formatGBP(amount)} payment for the ${esc(planName)} plan (${esc(domain)}) didn't go through. We'll try again automatically over the next few days.</p><p>To avoid any interruption, please check or update your card.</p>`,
        { label: "Update your card", href: appUrl("/portal/hosting") },
      ),
    );
  },

  adminHostingSubscribed(planId: string, clientName: string, domain: string, planName: string) {
    return admin(`Automatic payments set up: ${domain}`, `<p>${esc(clientName)} set up automatic card payments for ${esc(planName)} (${esc(domain)}).</p>`, planId);
  },

  adminHostingCancelled(planId: string, clientName: string, domain: string, endsOn: Date) {
    return admin(`Hosting cancelled: ${domain}`, `<p>${esc(clientName)} cancelled hosting for ${esc(domain)}. It ends on <strong>${longDate(endsOn)}</strong> and won't renew.</p>`, planId);
  },

  adminHostingResumed(planId: string, clientName: string, domain: string) {
    return admin(`Hosting kept: ${domain}`, `<p>${esc(clientName)} changed their mind and kept hosting for ${esc(domain)}. It will renew as normal.</p>`, planId);
  },

  adminHostingPaymentFailed(planId: string, clientName: string, domain: string, amount: number) {
    return admin(`Payment failed: ${domain}`, `<p>An automatic ${formatGBP(amount)} hosting payment from ${esc(clientName)} (${esc(domain)}) failed. Stripe will retry, and the client has been asked to update their card.</p>`, planId);
  },

  /** Lets the Lumora team know an invoice was paid online. */
  adminInvoicePaid(invoiceId: string, number: string, clientName: string, total: number) {
    const to = process.env.ADMIN_NOTIFY_EMAIL;
    if (!to) return Promise.resolve(true);
    return send(
      to,
      `Paid: invoice ${number} (${formatGBP(total)})`,
      layout("Invoice paid online", `<p>${esc(clientName)} paid invoice ${esc(number)} for <strong>${formatGBP(total)}</strong> via Stripe.</p>`, {
        label: "Open invoice",
        href: appUrl(`/admin/invoices/${invoiceId}`),
      }),
    );
  },
};
