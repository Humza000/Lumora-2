import type { Metadata } from "next";
import { connection } from "next/server";
import { Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
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
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <PageHero eyebrow="Portfolio" title="Our work">
        From local trades to interiors e-commerce and hospitality: websites that turn visitors into customers.
      </PageHero>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={(i % 3) * 120} className="flex">
            <PortfolioCard item={item} />
          </Reveal>
        ))}
      </div>
      {items.length === 0 && <EmptyState title="Projects coming soon" />}
    </div>
  );
}
