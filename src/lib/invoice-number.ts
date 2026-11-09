import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { formatInvoiceNumber } from "./invoice";

/**
 * Atomically allocate the next invoice number for the year.
 * Must be called inside the same transaction that creates the invoice.
 */
export async function nextInvoiceNumber(tx: Prisma.TransactionClient, issueDate: Date) {
  const year = issueDate.getFullYear();
  const seq = await tx.invoiceSequence.upsert({
    where: { year },
    create: { year, last: 1 },
    update: { last: { increment: 1 } },
  });
  return formatInvoiceNumber(year, seq.last);
}
