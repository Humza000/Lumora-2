import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { PortfolioCard } from "@/components/portfolio-card";
import { EmptyState } from "@/components/ui";
import { buildSafe } from "@/lib/build-safe";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Our work",
  description:
    "Website design and development case studies by Lumora: custom sites for fitness, hospitality, retail, legal and more.",
  path: "/portfolio",
});

// Pre-built and served from the CDN (no database on the visitor's request). Rebuilt in the
// background at most hourly, and immediately when the portfolio is edited in the admin
// (revalidatePath in admin/_actions/portfolio.ts).
export const revalidate = 3600;

export default async function PortfolioPage() {
  const items = await buildSafe(
    () => db.portfolioItem.findMany({ where: { published: true }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] }),
    [],
  );

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
