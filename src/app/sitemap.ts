import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];

// Public marketing pages. Private and auth pages (/admin, /portal, /quote,
// /login, /signup, ...) are left out on purpose: robots.ts blocks them.
const PAGES: { path: string; priority: number; changeFrequency: Entry["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/portfolio", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
];

/** Image URLs in a sitemap must be absolute. */
function absolute(url: string) {
  return /^https?:\/\//i.test(url) ? url : appUrl(url.startsWith("/") ? url : `/${url}`);
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // If the database is unreachable, still serve the static pages
  // rather than failing the whole sitemap (Google would then see an error).
  let items: { slug: string; createdAt: Date; imageUrl: string | null }[] = [];
  try {
    items = await db.portfolioItem.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      select: { slug: true, createdAt: true, imageUrl: true },
    });
  } catch (err) {
    console.error("[sitemap] could not load portfolio items", err);
  }

  const now = new Date();
  const newestWork = items.reduce<Date | undefined>(
    (latest, i) => (!latest || i.createdAt > latest ? i.createdAt : latest),
    undefined,
  );

  const pages: Entry[] = PAGES.map(({ path, priority, changeFrequency }) => ({
    url: appUrl(path),
    // The portfolio index changes when new work is added; the rest on deploy.
    lastModified: path === "/portfolio" && newestWork ? newestWork : now,
    changeFrequency,
    priority,
  }));

  const caseStudies: Entry[] = items.map((i) => ({
    url: appUrl(`/portfolio/${i.slug}`),
    lastModified: i.createdAt,
    changeFrequency: "yearly",
    priority: 0.7,
    ...(i.imageUrl ? { images: [absolute(i.imageUrl)] } : {}),
  }));

  return [...pages, ...caseStudies];
}
