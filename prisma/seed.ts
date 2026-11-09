// Seed: admin user, quote pricing, portfolio, and (optionally) a demo client.
// Run with `npm run db:seed`. Safe to re-run (upserts).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_PRICES, PRICING_CATALOGUE } from "../src/lib/pricing";
import { DEFAULT_MILESTONES } from "../src/lib/progress";
import { formatInvoiceNumber } from "../src/lib/invoice";
import { portfolioSeed } from "./portfolio-data";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  // --- Admin -------------------------------------------------------------
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@lumoradesign.uk").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 10) {
    throw new Error("Set ADMIN_PASSWORD (10+ characters) in .env before seeding.");
  }
  await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Lumora Admin",
      role: "ADMIN",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });
  console.log(`✓ admin: ${adminEmail}`);

  // --- Pricing -----------------------------------------------------------
  for (const [i, item] of PRICING_CATALOGUE.entries()) {
    await db.pricingItem.upsert({
      where: { key: item.key },
      update: {},
      create: { ...item, price: DEFAULT_PRICES[item.key] ?? 0, sortOrder: i },
    });
  }
  console.log(`✓ ${PRICING_CATALOGUE.length} pricing items`);

  // --- Portfolio ---------------------------------------------------------
  for (const [i, item] of portfolioSeed.entries()) {
    await db.portfolioItem.upsert({ where: { slug: item.slug }, update: {}, create: { ...item, sortOrder: i } });
  }
  console.log(`✓ ${portfolioSeed.length} portfolio items`);

  // --- Demo client (skip in production with SEED_DEMO=false) ---------------
  if (process.env.SEED_DEMO === "false") return;
  const demoEmail = "demo.client@example.com";
  if (await db.user.findUnique({ where: { email: demoEmail } })) {
    console.log("✓ demo client already exists");
    return;
  }
  const now = Date.now();
  const day = 86400_000;
  const client = await db.user.create({
    data: {
      email: demoEmail,
      name: "Demo Client",
      role: "CLIENT",
      emailVerified: new Date(),
      passwordHash: await bcrypt.hash("DemoClient123", 12),
      profile: { create: { company: "Demo Coffee Co.", phone: "07000 000000" } },
    },
  });
  const project = await db.project.create({
    data: {
      clientId: client.id,
      title: "Demo Coffee Co.: Business website",
      description: "A five-page website with online table reservations.",
      status: "IN_PROGRESS",
      startDate: new Date(now - 21 * day),
      dueDate: new Date(now + 35 * day),
      milestones: {
        create: DEFAULT_MILESTONES.map((m, i) => ({
          ...m,
          order: i,
          status: i < 2 ? "DONE" : i === 2 ? "IN_PROGRESS" : "PENDING",
          completedAt: i < 2 ? new Date(now - (14 - i * 7) * day) : null,
          dueDate: new Date(now + (i * 10 - 10) * day),
        })),
      },
      updates: {
        create: [
          { body: "Kick-off complete. Sitemap and content plan approved.", createdAt: new Date(now - 18 * day) },
          { body: "Homepage and inner page designs signed off. Development has started!", createdAt: new Date(now - 4 * day) },
        ],
      },
    },
  });
  const year = new Date().getFullYear();
  const seq = await db.invoiceSequence.upsert({ where: { year }, create: { year, last: 1 }, update: { last: { increment: 1 } } });
  await db.invoice.create({
    data: {
      number: formatInvoiceNumber(year, seq.last),
      clientId: client.id,
      projectId: project.id,
      status: "SENT",
      issueDate: new Date(now - 3 * day),
      dueDate: new Date(now + 11 * day),
      vatRate: 0,
      subtotal: 75000,
      vat: 0,
      total: 75000,
      notes: "50% deposit: thank you!",
      lines: { create: { description: "Website project: 50% deposit", quantity: 1, unitPrice: 75000 } },
    },
  });
  await db.hostingPlan.create({
    data: {
      clientId: client.id,
      projectId: project.id,
      domain: "democoffee.example",
      provider: "Vercel",
      planName: "Hosting & Care Plan",
      price: 4900,
      interval: "MONTHLY",
      renewalDate: new Date(now + 9 * day),
    },
  });
  console.log(`✓ demo client: ${demoEmail} / DemoClient123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
