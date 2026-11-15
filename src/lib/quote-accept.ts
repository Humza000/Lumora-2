import "server-only";
import { db } from "./db";
import { emails } from "./email";
import { calculateTotals } from "./invoice";
import { nextInvoiceNumber } from "./invoice-number";
import { summariseQuote } from "./pricing";
import { DEFAULT_MILESTONES } from "./progress";
import { offerInvoiceLines, type PaymentChoice } from "./quote-offer";

const DAY = 86400_000;

/**
 * The client accepts the confirmed quote, choosing to pay in full or a 50% deposit: the quote
 * becomes ACCEPTED, the project is created (waiting for payment) and the website invoice is
 * issued. All in one transaction, then emails. Work starts when the invoice is paid
 * (`startProjectIfPaid`).
 * Returns the new project's id, or null if the quote isn't this client's or isn't waiting for a
 * reply (e.g. a second click, or the admin withdrew it meanwhile).
 */
export async function acceptOffer(quoteId: string, clientId: string, choice: PaymentChoice) {
  const quote = await db.quote.findFirst({
    where: { id: quoteId, userId: clientId, status: "SENT" },
    include: { user: { select: { name: true, email: true } }, project: { select: { id: true } } },
  });
  if (!quote || quote.project || quote.price === null) return null;

  const summary = summariseQuote(quote.answers);
  const lines = offerInvoiceLines(quote.price, choice, summary.packageName);
  const title = quote.projectTitle ?? `${quote.user.name}: ${summary.packageName ?? "Website"}`;
  const now = new Date();

  const result = await db.$transaction(async (tx) => {
    // Conditional update: only one of two simultaneous clicks gets to create the project.
    const { count } = await tx.quote.updateMany({
      where: { id: quote.id, userId: clientId, status: "SENT" },
      data: { status: "ACCEPTED", respondedAt: now, declineReason: null, changeRequest: null, invoiceOnAccept: choice },
    });
    if (count !== 1) return null;

    const project = await tx.project.create({
      data: {
        title,
        description: quote.projectDescription,
        clientId,
        quoteId: quote.id,
        // A free quote has nothing to pay, so work can start straight away.
        status: lines.length ? "AWAITING_PAYMENT" : "PLANNING",
        startDate: quote.startDate,
        dueDate: quote.dueDate,
        milestones: quote.defaultMilestones ? { create: DEFAULT_MILESTONES.map((m, i) => ({ ...m, order: i })) } : undefined,
        updates: { create: { body: lines.length
              ? "You accepted your quote and your project has been set up. Welcome aboard! Work starts as soon as your invoice is paid."
              : "You accepted your quote and your project has been set up. Welcome aboard!" } },
      },
    });

    const invoice = lines.length
      ? await tx.invoice.create({
          data: {
            clientId,
            projectId: project.id,
            quoteId: quote.id,
            number: await nextInvoiceNumber(tx, now),
            status: "SENT",
            issueDate: now,
            dueDate: new Date(now.getTime() + 14 * DAY),
            vatRate: 0,
            ...calculateTotals(lines, 0),
            lines: { create: lines },
          },
        })
      : null;
    return { project, invoice };
  });
  if (!result) return null;

  const { project, invoice } = result;
  await Promise.all([
    invoice && emails.invoiceSent(quote.user.email, quote.user.name, invoice.id, invoice.number!, invoice.total, invoice.dueDate),
    emails.adminQuoteAccepted(quote.id, quote.user.name, project.title, quote.price, invoice?.number ?? null),
  ]);
  return project.id;
}

/** The client declines the confirmed quote, optionally saying why. False if it wasn't waiting for a reply. */
export async function declineOffer(quoteId: string, clientId: string, reason: string | null) {
  const { count } = await db.quote.updateMany({
    where: { id: quoteId, userId: clientId, status: "SENT" },
    data: { status: "DECLINED", respondedAt: new Date(), declineReason: reason },
  });
  if (count !== 1) return false;
  const user = await db.user.findUnique({ where: { id: clientId }, select: { name: true } });
  await emails.adminQuoteDeclined(quoteId, user?.name ?? "A client", reason);
  return true;
}
