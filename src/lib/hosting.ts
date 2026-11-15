// Pure hosting/maintenance helpers.

export function advanceRenewal(date: Date, interval: "MONTHLY" | "ANNUAL"): Date {
  const next = new Date(date);
  const day = next.getDate();
  if (interval === "ANNUAL") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  // Clamp month overflow (e.g. 31 Jan + 1 month → 28/29 Feb, not 3 Mar).
  if (next.getDate() !== day) next.setDate(0);
  return next;
}

export function daysUntil(date: Date, now = new Date()) {
  return Math.ceil((date.getTime() - now.getTime()) / 86400_000);
}

/** Monthly-equivalent recurring revenue, in pence. */
export function monthlyValue(price: number, interval: "MONTHLY" | "ANNUAL") {
  return interval === "MONTHLY" ? price : Math.round(price / 12);
}

export function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86400_000);
}

export type FirstCharge =
  /** Nothing paid yet (or renewal is due now): charge today, then every period. */
  | { kind: "now" }
  /** Already paid up to `at` (e.g. on the first invoice): save the card, first charge on `at`. */
  | { kind: "on", at: Date };

/**
 * When a new card subscription should first charge. If the plan's renewal date is in the future,
 * the current period is already paid for, so the first automatic charge waits until then.
 * Within a day of renewal we simply charge now (Stripe needs future dates to be ≥ 48h away).
 */
export function firstCharge(renewalDate: Date, now = new Date()): FirstCharge {
  return renewalDate.getTime() - now.getTime() > 2 * 86400_000 ? { kind: "on", at: renewalDate } : { kind: "now" };
}

export type HostingBillingState = "manual" | "active" | "past_due" | "cancelling" | "cancelled";

/** How a plan is billed, for the portal and admin. */
export function hostingBillingState(plan: {
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  cancelAt: Date | null;
}, now = new Date()): HostingBillingState {
  if (plan.status === "CANCELLED" || plan.subscriptionStatus === "canceled") return "cancelled";
  if (plan.cancelAt) return plan.cancelAt <= now ? "cancelled" : "cancelling";
  if (!plan.stripeSubscriptionId) return "manual";
  if (plan.subscriptionStatus === "past_due" || plan.subscriptionStatus === "unpaid") return "past_due";
  return "active";
}

/**
 * A plan created when the project launched that hasn't had its first payment yet: the client
 * starts it themselves by card (choosing monthly or yearly), which sets up automatic renewals.
 */
export function awaitingFirstPayment(
  plan: { planKey: string | null; stripeSubscriptionId: string | null; status: string; cancelAt: Date | null },
  invoiceCount: number,
) {
  return Boolean(plan.planKey) && !plan.stripeSubscriptionId && plan.status === "ACTIVE" && !plan.cancelAt && invoiceCount === 0;
}

/**
 * Monthly and yearly prices offered when the client starts their plan (pence). The interval they
 * were quoted keeps its quoted price; the other comes from the price list.
 */
export function startPlanPrices(quoted: { interval: "MONTHLY" | "ANNUAL"; price: number }, catalogue: { monthly: number; yearly: number }) {
  return {
    MONTHLY: quoted.interval === "MONTHLY" ? quoted.price : catalogue.monthly,
    ANNUAL: quoted.interval === "ANNUAL" ? quoted.price : catalogue.yearly,
  };
}
