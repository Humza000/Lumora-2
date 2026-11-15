import "server-only";
import { db } from "./db";
import { startPlanPrices } from "./hosting";
import { getPriceMap } from "./prices";
import { hostingPrices } from "./pricing";
import { hostingFromQuote } from "./quote-offer";

/** Monthly and yearly prices for a plan that's waiting for its first payment. */
export async function planStartPrices(plan: { planKey: string | null; interval: "MONTHLY" | "ANNUAL"; price: number; projectId: string | null }) {
  const quote = plan.projectId
    ? await db.quote.findFirst({ where: { project: { id: plan.projectId } }, select: { hostingPlanKey: true, hostingBilling: true, hostingPrice: true } })
    : null;
  const quoted = (quote && hostingFromQuote(quote)) || { interval: plan.interval, price: plan.price };
  return startPlanPrices(quoted, hostingPrices(plan.planKey ?? "", await getPriceMap()));
}
