import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const items = await db.portfolioItem.findMany({ where: { published: true }, select: { slug: true, createdAt: true } });
  return [
    ...["", "/services", "/portfolio", "/about", "/contact"].map((p) => ({ url: appUrl(p) })),
    ...items.map((i) => ({ url: appUrl(`/portfolio/${i.slug}`), lastModified: i.createdAt })),
  ];
}
