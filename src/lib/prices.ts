import "server-only";
import { db } from "./db";
import { DEFAULT_PRICES, type PriceMap } from "./pricing";

/** Admin-editable prices merged over the defaults. */
export async function getPriceMap(): Promise<PriceMap> {
  const rows = await db.pricingItem.findMany({ where: { active: true } });
  return { ...DEFAULT_PRICES, ...Object.fromEntries(rows.map((r) => [r.key, r.price])) };
}
