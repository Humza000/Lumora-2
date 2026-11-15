// Rules for what the admin can delete. Deleting removes it from the client portal too.
// Paid invoices are proof of payment, so they're never deleted (and block deleting their quote).

export function canDeleteInvoice(status: string) {
  return status !== "PAID";
}

/** Why a quote (with its project and unpaid invoices) can't be deleted, or null if it can. */
export function quoteDeleteBlocker({ paidInvoices, hasHostingPlan }: { paidInvoices: number; hasHostingPlan: boolean }) {
  if (paidInvoices > 0) return "This quote has paid invoices, so it can't be deleted.";
  if (hasHostingPlan) return "The project has a hosting plan. Delete the hosting plan first.";
  return null;
}
