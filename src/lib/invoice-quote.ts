import "server-only";
import { db } from "./db";

/**
 * Adds the linked quote's answers to an invoice loaded with `invoiceViewInclude`, for the
 * package / hosting details on the invoice. Loaded separately rather than joined into the
 * invoice query: joining the quote's JSON answers there dropped the connection on the local
 * Prisma dev database in the PDF route.
 */
export async function withQuote<T extends { quoteId: string | null }>(invoice: T) {
  const quote = invoice.quoteId
    ? await db.quote.findUnique({ where: { id: invoice.quoteId }, select: { answers: true } })
    : null;
  return { ...invoice, quote };
}
