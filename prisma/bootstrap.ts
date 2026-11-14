// Runs on every deploy (see "build" in package.json), after `prisma db push`.
// Makes a fresh production database usable without running the full seed:
//   - admin account from ADMIN_EMAIL / ADMIN_PASSWORD (created, or password/email updated)
//   - any missing quote prices (existing, admin-edited prices are left alone)
//   - portfolio case studies, ONLY if there are none yet (admin edits are never overwritten)
// It never creates demo data, and it never fails the build because a variable is missing.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_PRICES, PRICING_CATALOGUE } from "../src/lib/pricing";
import { ensureAdmin } from "./admin";
import { portfolioSeed } from "./portfolio-data";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("[bootstrap] DATABASE_URL not set; skipping.");
    return;
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      await ensureAdmin(db, ADMIN_EMAIL, ADMIN_PASSWORD);
    } else {
      console.warn("[bootstrap] ADMIN_EMAIL / ADMIN_PASSWORD not set: admin account not created or updated.");
    }

    const existing = new Set((await db.pricingItem.findMany({ select: { key: true } })).map((p) => p.key));
    const missing = PRICING_CATALOGUE.filter((p) => !existing.has(p.key));
    for (const [i, item] of PRICING_CATALOGUE.entries()) {
      if (existing.has(item.key)) continue;
      await db.pricingItem.create({ data: { ...item, price: DEFAULT_PRICES[item.key] ?? 0, sortOrder: i } });
    }
    console.log(`✓ pricing: ${missing.length} added`);

    if ((await db.portfolioItem.count()) === 0) {
      for (const [i, item] of portfolioSeed.entries()) {
        await db.portfolioItem.create({ data: { ...item, sortOrder: i, published: true } });
      }
      console.log(`✓ portfolio: ${portfolioSeed.length} case studies added`);
    } else {
      console.log("✓ portfolio: already set up, left unchanged");
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  // A bootstrap problem must not take the site down: log it and let the build continue.
  console.error("[bootstrap] failed:", e);
});
