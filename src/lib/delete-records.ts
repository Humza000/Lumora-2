import "server-only";
import { db } from "./db";
import { getStripe } from "./stripe";
import { expireCheckoutSessions } from "./stripe-cleanup";

// Full deletes from the admin. Everything linked goes too, paid invoices included, and it all
// disappears from the client portal. Deleting a paid invoice does NOT refund it: the payment stays in Stripe.

/** Cancels a plan's card subscription so the client is never charged again. Returns an error message or null. */
async function cancelSubscription(plan: { stripeSubscriptionId: string | null; subscriptionStatus: string | null }) {
  if (!plan.stripeSubscriptionId || plan.subscriptionStatus === "canceled") return null;
  try {
    await getStripe().subscriptions.cancel(plan.stripeSubscriptionId);
  } catch (err) {
    if ((err as { code?: string }).code === "resource_missing") return null; // already gone in Stripe
    console.error("[stripe] couldn't cancel subscription", err);
    return "Couldn't cancel the card subscription in Stripe, so nothing was deleted. Please try again.";
  }
  return null;
}

/** Deletes hosting plans and all their invoices, cancelling card subscriptions first. Error message or null. */
export async function deleteHostingPlans(planIds: string[]) {
  if (planIds.length === 0) return null;
  const plans = await db.hostingPlan.findMany({ where: { id: { in: planIds } }, select: { stripeSubscriptionId: true, subscriptionStatus: true } });
  for (const plan of plans) {
    const error = await cancelSubscription(plan);
    if (error) return error;
  }
  const invoiceWhere = { hostingPlanId: { in: planIds } };
  const invoices = await db.invoice.findMany({ where: invoiceWhere, select: { stripeSessionId: true } });
  await expireCheckoutSessions(invoices.map((i) => i.stripeSessionId));
  await db.$transaction([db.invoice.deleteMany({ where: invoiceWhere }), db.hostingPlan.deleteMany({ where: { id: { in: planIds } } })]);
  return null;
}

/**
 * Deletes a quote and/or its project together with everything linked: milestones and updates,
 * every invoice of the quote or project, and the project's hosting plans (subscriptions cancelled).
 * Used by both "Delete quote" and "Delete project". Error message or null.
 */
export async function deleteQuoteAndProject({ quoteId, projectId }: { quoteId: string | null; projectId: string | null }) {
  if (projectId) {
    const plans = await db.hostingPlan.findMany({ where: { projectId }, select: { id: true } });
    const error = await deleteHostingPlans(plans.map((p) => p.id));
    if (error) return error;
  }
  const invoiceWhere = { OR: [...(quoteId ? [{ quoteId }] : []), ...(projectId ? [{ projectId }] : [])] };
  const invoices = await db.invoice.findMany({ where: invoiceWhere, select: { stripeSessionId: true } });
  await expireCheckoutSessions(invoices.map((i) => i.stripeSessionId));
  await db.$transaction([
    db.invoice.deleteMany({ where: invoiceWhere }),
    ...(projectId ? [db.project.deleteMany({ where: { id: projectId } })] : []),
    ...(quoteId ? [db.quote.deleteMany({ where: { id: quoteId } })] : []),
  ]);
  return null;
}
