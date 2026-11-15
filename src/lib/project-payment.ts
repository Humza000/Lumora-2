import "server-only";
import { db } from "./db";

/**
 * Work starts once the website invoice is paid: moves a project that is waiting for payment to
 * Planning and tells the client. Call wherever an invoice becomes PAID (Stripe webhook, admin
 * "mark as paid"). Safe to call repeatedly; only the first call for a waiting project does anything.
 */
export async function startProjectIfPaid(projectId: string | null) {
  if (!projectId) return;
  const { count } = await db.project.updateMany({
    where: { id: projectId, status: "AWAITING_PAYMENT", invoices: { some: { status: "PAID" } } },
    data: { status: "PLANNING" },
  });
  if (count === 1) {
    await db.projectUpdate.create({ data: { projectId, body: "Payment received, thank you! Work on your website has started." } });
  }
}
