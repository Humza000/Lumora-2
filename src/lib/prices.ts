import "server-only";
import { db } from "./db";
import { DEFAULT_PRICES, PRICING_CATALOGUE, type PriceMap } from "./pricing";

const CURRENT_KEYS = PRICING_CATALOGUE.map((p) => p.key);

/** Admin-editable prices merged over the defaults. Rows for retired keys are ignored. */
export async function getPriceMap(): Promise<PriceMap> {
  const rows = await db.pricingItem.findMany({ where: { active: true, key: { in: CURRENT_KEYS } } });
  return { ...DEFAULT_PRICES, ...Object.fromEntries(rows.map((r) => [r.key, r.price])) };
}
