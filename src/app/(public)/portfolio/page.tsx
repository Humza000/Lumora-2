import type { Metadata } from "next";
import { connection } from "next/server";
import { PortfolioCard } from "@/components/portfolio-card";
import { EmptyState } from "@/components/ui";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Our work",
  description: "Selected website design and development projects by Lumora.",
};

export default async function PortfolioPage() {
  await connection();
  const items = await db.portfolioItem.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="text-sm font-medium text-brand">Portfolio</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Our work</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">
        Fitness, e-commerce, legal, hospitality, healthcare and trades: websites that turn visitors into customers.
      </p>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <PortfolioCard key={item.id} item={item} />
        ))}
      </div>
      {items.length === 0 && <EmptyState title="Projects coming soon" />}
    </div>
  );
}
