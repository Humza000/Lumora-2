import "server-only";
import type Stripe from "stripe";
import { db } from "./db";
import { emails } from "./email";
import { advanceRenewal, firstCharge } from "./hosting";
import { nextInvoiceNumber } from "./invoice-number";
import { appUrl, site } from "./site";
import { getStripe } from "./stripe";

// Automatic card billing for hosting & care plans, using Stripe subscriptions.
// - The client starts it from their portal (Stripe Checkout, subscription mode).
// - If the current period is already paid (e.g. on their first invoice), the first charge waits
//   until the plan's renewal date.
// - Each successful charge is recorded as a PAID invoice (numbered as usual), so it appears in
//   the client's portal and the admin invoice list.
// - Cancelling stops renewal at the end of the period they've paid for.

type PlanWithClient = Awaited<ReturnType<typeof loadPlan>>;

function loadPlan(where: { id: string } | { stripeSubscriptionId: string }) {
  return db.hostingPlan.findFirst({
    where,
    include: { client: { select: { id: true, name: true, email: true, profile: { select: { stripeCustomerId: true } } } } },
  });
}

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));
const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Starts Stripe Checkout so the client can save a card and subscribe. Returns the Checkout URL. */
export async function startHostingCheckout(plan: NonNullable<PlanWithClient>) {
  const interval = plan.interval === "ANNUAL" ? "year" : "month";
  const timing = firstCharge(plan.renewalDate);
  const subscription_data: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    description: `${plan.planName}: ${plan.domain}`,
    metadata: { hostingPlanId: plan.id },
  };
  if (timing.kind === "on") {
    const at = Math.floor(timing.at.getTime() / 1000);
    // Within one billing period: anchor the cycle there and charge nothing until then.
    // Further out (unusual): start billing at that date via a trial end instead.
    if (timing.at <= advanceRenewal(new Date(), plan.interval)) {
      subscription_data.billing_cycle_anchor = at;
      subscription_data.proration_behavior = "none";
    } else {
      subscription_data.trial_end = at;
    }
  }

  const customer = plan.client.profile?.stripeCustomerId ?? undefined;
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    client_reference_id: plan.client.id,
    ...(customer ? { customer } : { customer_email: plan.client.email }),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: plan.price,
          recurring: { interval },
          product_data: { name: `${site.name} ${plan.planName}`, description: `Hosting & care for ${plan.domain}` },
        },
      },
    ],
    subscription_data,
    metadata: { hostingPlanId: plan.id },
    success_url: appUrl("/portal/hosting?subscribed=1"),
    cancel_url: appUrl("/portal/hosting"),
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout URL");
  return session.url;
}

/** checkout.session.completed (subscription mode): link the new subscription to the plan. */
export async function onSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const planId = session.metadata?.hostingPlanId;
  const subscriptionId = idOf(session.subscription);
  const customerId = idOf(session.customer);
  if (!planId || !subscriptionId) return;
  const plan = await loadPlan({ id: planId });
  if (!plan || (session.client_reference_id && session.client_reference_id !== plan.client.id)) return;

  await db.$transaction([
    db.hostingPlan.update({
      where: { id: plan.id },
      data: { stripeSubscriptionId: subscriptionId, subscriptionStatus: "active", cancelAt: null, status: "ACTIVE" },
    }),
    ...(customerId
      ? [db.clientProfile.upsert({ where: { userId: plan.client.id }, update: { stripeCustomerId: customerId }, create: { userId: plan.client.id, stripeCustomerId: customerId } })]
      : []),
  ]);
  if (!plan.stripeSubscriptionId) await emails.adminHostingSubscribed(plan.id, plan.client.name, plan.domain, plan.planName);
}

/** Records that a plan will stop at `cancelAt`; emails both sides once (whoever got there first). */
async function markCancelling(plan: NonNullable<PlanWithClient>, cancelAt: Date) {
  const { count } = await db.hostingPlan.updateMany({ where: { id: plan.id, cancelAt: null }, data: { cancelAt } });
  if (count === 1) {
    await Promise.all([
      emails.hostingCancelled(plan.client.email, plan.client.name, plan.planName, plan.domain, cancelAt),
      emails.adminHostingCancelled(plan.id, plan.client.name, plan.domain, cancelAt),
    ]);
  }
}

/** customer.subscription.created / updated / deleted: keep the plan in step with Stripe. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const plan = (await loadPlan({ stripeSubscriptionId: sub.id })) ?? (sub.metadata?.hostingPlanId ? await loadPlan({ id: sub.metadata.hostingPlanId }) : null);
  if (!plan) return;

  const periodEnd = sub.items.data[0]?.current_period_end;
  const renewal = periodEnd ? new Date(periodEnd * 1000) : plan.renewalDate;
  const cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : sub.cancel_at_period_end ? renewal : null;

  await db.hostingPlan.update({
    where: { id: plan.id },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      renewalDate: renewal,
      ...(sub.status === "canceled" ? { status: "CANCELLED" } : {}),
      ...(cancelAt ? {} : { cancelAt: null }),
    },
  });
  if (cancelAt) await markCancelling(plan, cancelAt);
}

/** Client asked to cancel: stop at the end of the period they've paid for. */
export async function cancelHosting(plan: NonNullable<PlanWithClient>) {
  if (plan.stripeSubscriptionId) {
    const sub = await getStripe().subscriptions.update(plan.stripeSubscriptionId, { cancel_at_period_end: true });
    await syncSubscription(sub);
  } else {
    // Invoiced plan: no more invoices after the current period.
    await markCancelling(plan, plan.renewalDate);
  }
}

/** Client changed their mind before the plan ended. */
export async function resumeHosting(plan: NonNullable<PlanWithClient>) {
  if (plan.stripeSubscriptionId) {
    const sub = await getStripe().subscriptions.update(plan.stripeSubscriptionId, { cancel_at_period_end: false, cancel_at: "" });
    await syncSubscription(sub);
  }
  await db.hostingPlan.update({ where: { id: plan.id }, data: { cancelAt: null } });
  await emails.adminHostingResumed(plan.id, plan.client.name, plan.domain);
}

/** Stripe's own page for updating the card and downloading receipts. Returns its URL. */
export async function billingPortalUrl(customerId: string) {
  const session = await getStripe().billingPortal.sessions.create({ customer: customerId, return_url: appUrl("/portal/hosting") });
  return session.url;
}

function subscriptionOf(inv: Stripe.Invoice) {
  const details = inv.parent?.subscription_details;
  return { subscriptionId: idOf(details?.subscription), planId: details?.metadata?.hostingPlanId ?? null };
}

/** invoice.paid for a subscription: record the payment as a PAID invoice in Lumora. */
export async function recordSubscriptionPayment(inv: Stripe.Invoice) {
  const { subscriptionId, planId } = subscriptionOf(inv);
  if (!subscriptionId || inv.amount_paid <= 0) return; // £0 first invoice when the period was already paid
  const plan = (await loadPlan({ stripeSubscriptionId: subscriptionId })) ?? (planId ? await loadPlan({ id: planId }) : null);
  if (!plan || (await db.invoice.findUnique({ where: { stripeInvoiceId: inv.id } }))) return;

  const period = inv.lines?.data?.[0]?.period;
  const range = period ? ` (${fmt(new Date(period.start * 1000))} – ${fmt(new Date(period.end * 1000))})` : "";
  const now = new Date();
  let invoice;
  try {
    invoice = await db.$transaction(async (tx) => {
      const number = await nextInvoiceNumber(tx, now);
      return tx.invoice.create({
        data: {
          number,
          clientId: plan.clientId,
          projectId: plan.projectId,
          hostingPlanId: plan.id,
          status: "PAID",
          issueDate: now,
          dueDate: now,
          paidAt: now,
          vatRate: 0,
          subtotal: inv.amount_paid,
          vat: 0,
          total: inv.amount_paid,
          stripeInvoiceId: inv.id,
          notes: "Paid automatically by card.",
          lines: { create: { description: `${plan.planName}: ${plan.domain}${range}`, quantity: 1, unitPrice: inv.amount_paid } },
        },
      });
    });
  } catch (err) {
    // Stripe retried the event and another delivery recorded it first.
    if ((err as { code?: string }).code === "P2002") return;
    throw err;
  }
  await Promise.all([
    emails.invoicePaid(plan.client.email, plan.client.name, invoice.id, invoice.number ?? "", invoice.total),
    emails.adminInvoicePaid(invoice.id, invoice.number ?? "", plan.client.name, invoice.total),
  ]);
}

/** invoice.payment_failed for a subscription: ask the client to update their card. */
export async function subscriptionPaymentFailed(inv: Stripe.Invoice) {
  const { subscriptionId, planId } = subscriptionOf(inv);
  if (!subscriptionId) return;
  const plan = (await loadPlan({ stripeSubscriptionId: subscriptionId })) ?? (planId ? await loadPlan({ id: planId }) : null);
  if (!plan) return;
  await db.hostingPlan.update({ where: { id: plan.id }, data: { subscriptionStatus: "past_due" } });
  await Promise.all([
    emails.hostingPaymentFailed(plan.client.email, plan.client.name, plan.planName, plan.domain, inv.amount_due),
    emails.adminHostingPaymentFailed(plan.id, plan.client.name, plan.domain, inv.amount_due),
  ]);
}

export { loadPlan as loadHostingPlan };
