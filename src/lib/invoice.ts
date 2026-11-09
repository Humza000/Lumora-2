// Pure invoice helpers (safe to unit test). DB-backed numbering lives in invoice-number.ts.

export type LineInput = { description: string; quantity: number; unitPrice: number };

export function calculateTotals(lines: LineInput[], vatRate: number) {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const vat = Math.round((subtotal * vatRate) / 100);
  return { subtotal, vat, total: subtotal + vat };
}

export const INVOICE_PREFIX = "LUM";

/** LUM-2026-0001 */
export function formatInvoiceNumber(year: number, seq: number) {
  return `${INVOICE_PREFIX}-${year}-${String(seq).padStart(4, "0")}`;
}

/** SENT invoices past their due date are shown (and can be marked) as overdue. */
export function effectiveStatus<S extends string>(status: S, dueDate: Date, now = new Date()): S | "OVERDUE" {
  if (status === "SENT" && dueDate.getTime() < now.getTime()) return "OVERDUE";
  return status;
}
