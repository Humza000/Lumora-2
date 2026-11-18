// The confirmed quote ("offer") an admin sends back to a client, who accepts it, asks for changes
// or declines it. Pure logic (no server-only), unit tested.
import type { LineInput } from "./invoice";
import { formatGBP } from "./money";
import { HOSTING_PLANS, PROJECT_TYPES, featureLabel, featuresForType, quoteDraftSchema } from "./pricing";

/** How the client chooses to pay for the website when they accept. */
export const PAYMENT_CHOICES = ["full", "deposit"] as const;
export type PaymentChoice = (typeof PAYMENT_CHOICES)[number];

export type Offer = {
  price: number | null;
  hostingPlanKey: string | null;
  hostingBilling: string | null;
  hostingPrice: number | null;
};

/** Admin can send (or change and re-send) a confirmed quote in these statuses. */
export const canSendOffer = (status: string) => ["SUBMITTED", "REVIEWING", "CHANGES_REQUESTED", "SENT", "DECLINED"].includes(status);

/** The client can accept, request changes or decline only while a confirmed quote is waiting for them. */
export const canRespond = (status: string) => status === "SENT";

/** Quotes waiting for the admin to act. */
export const NEEDS_REVIEW = ["SUBMITTED", "REVIEWING", "CHANGES_REQUESTED"] as const;

/** Confirmed hosting as text: "Standard care, £10/month", "No hosting required", or null if none set. */
export function offerHosting(offer: Pick<Offer, "hostingPlanKey" | "hostingBilling" | "hostingPrice">) {
  const plan = HOSTING_PLANS.find((p) => p.key === offer.hostingPlanKey);
  if (!plan) return null;
  if (!offer.hostingPrice) return plan.label;
  return `${plan.label}, ${formatGBP(offer.hostingPrice, { whole: offer.hostingPrice % 100 === 0 })}/${offer.hostingBilling === "yearly" ? "year" : "month"}`;
}

/** Amount of the website invoice issued on acceptance, pence. */
export function offerInvoiceAmount(price: number | null, choice: PaymentChoice) {
  return choice === "deposit" ? Math.round((price ?? 0) / 2) : (price ?? 0);
}

/**
 * Lines of the website invoice issued when the client accepts. Hosting is never included: it
 * starts when the site launches and is paid by card subscription.
 */
export function offerInvoiceLines(price: number | null, choice: PaymentChoice, packageName: string | null): LineInput[] {
  const amount = offerInvoiceAmount(price, choice);
  if (amount <= 0) return [];
  const what = `${packageName ?? "Website"}: website design & build`;
  return [{ description: choice === "deposit" ? `${what} (50% deposit)` : what, quantity: 1, unitPrice: amount }];
}

/**
 * Where payment for the website stands, from the accepted price and the invoices that bill the
 * quote (hosting and void invoices don't count). After a 50% deposit, `toInvoice` is the balance
 * still to be invoiced; `unpaid` is what has been invoiced (drafts included) but not paid yet.
 * Amounts are compared before VAT, in pence.
 */
export function websiteBalance(
  price: number | null,
  invoices: { subtotal: number; status: string; hostingPlanId: string | null }[],
) {
  const website = invoices.filter((i) => !i.hostingPlanId && i.status !== "VOID");
  const invoiced = website.reduce((sum, i) => sum + i.subtotal, 0);
  const unpaid = website.filter((i) => i.status !== "PAID").reduce((sum, i) => sum + i.subtotal, 0);
  return { toInvoice: Math.max(0, (price ?? 0) - invoiced), unpaid };
}

/** Lines of the invoice for the rest of the website price after a deposit. */
export function balanceInvoiceLines(amount: number, packageName: string | null): LineInput[] {
  if (amount <= 0) return [];
  return [{ description: `${packageName ?? "Website"}: website design & build (balance)`, quantity: 1, unitPrice: amount }];
}

/**
 * The hosting plan to create when the project launches, from the accepted quote. Null when the
 * client chose no (or free) hosting.
 */
export function hostingFromQuote(offer: Pick<Offer, "hostingPlanKey" | "hostingBilling" | "hostingPrice">) {
  const plan = HOSTING_PLANS.find((p) => p.key === offer.hostingPlanKey);
  if (!plan || !offer.hostingPrice) return null;
  return {
    planKey: plan.key as string,
    planName: plan.label as string,
    price: offer.hostingPrice,
    interval: offer.hostingBilling === "yearly" ? ("ANNUAL" as const) : ("MONTHLY" as const),
    includesMaintenance: plan.key !== "hosting_basic",
  };
}

/** What a client changed between two sets of wizard answers, as readable rows. */
export function answerChanges(previous: unknown, next: unknown) {
  const p = quoteDraftSchema.safeParse(previous);
  const n = quoteDraftSchema.safeParse(next);
  if (!p.success || !n.success) return [];
  const show = (a: typeof p.data): [string, string][] => [
    ["Project type", PROJECT_TYPES.find((t) => t.key === a.projectType)?.label ?? "—"],
    ["Pages", a.pages ? String(a.pages) : "—"],
    ["Features", featuresForType(a.projectType, a.features).map(featureLabel).sort().join(", ") || "None"],
    ["Additional requirements", a.featuresOther?.trim() || "—"],
    ["Hosting & care", HOSTING_PLANS.find((h) => h.key === a.hostingPlan)?.label ?? "—"],
    ["Hosting billed", a.hostingPlan && a.hostingPlan !== "hosting_none" ? (a.hostingBilling ?? "monthly") : "—"],
    ["Business", a.businessName?.trim() || "—"],
    ["Industry", a.industry?.trim() || "—"],
    ["Current site", a.existingSite?.trim() || "—"],
    ["Goals", a.goals?.trim() || "—"],
    ["Notes", a.notes?.trim() || "—"],
  ];
  const before = show(p.data);
  return show(n.data)
    .map(([label, to], i) => ({ label, from: before[i][1], to }))
    .filter((r) => r.from !== r.to);
}
