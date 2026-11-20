import { faqs, process as steps, services } from "@/lib/content";
import { buildSafe } from "@/lib/build-safe";
import { db } from "@/lib/db";
import { appUrl, site } from "@/lib/site";

// /llms.txt: a plain-Markdown summary of the site for AI assistants and answer engines (GEO).
// Built from the same content as the pages, so it stays in sync.
export const revalidate = 3600;

export async function GET() {
  const work = await buildSafe(
    () =>
      db.portfolioItem.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        select: { slug: true, title: true, sector: true, summary: true },
      }),
    [],
  );

  const body = [
    `# ${site.name}`,
    "",
    `> ${site.description} ${site.tagline}`,
    "",
    `${site.name} is a UK-based boutique studio that designs and builds custom websites, e-commerce stores and web apps, and offers managed hosting & care plans. Prices are in GBP. Clients get an instant estimate from the online quote wizard and follow their project in a client portal.`,
    "",
    "## Pages",
    `- [Home](${appUrl("/")}): overview, featured work and FAQs`,
    `- [Services](${appUrl("/services")}): what we offer`,
    `- [Portfolio](${appUrl("/portfolio")}): case studies`,
    `- [About](${appUrl("/about")}): who we are and how we work`,
    `- [Contact](${appUrl("/contact")}): email ${site.email}, Instagram @${site.instagram.handle}`,
    `- [Get a quote](${appUrl("/quote")}): instant estimate, no account needed to start`,
    "",
    "## Services",
    ...services.map((s) => `- **${s.title}**: ${s.description} (${s.points.join("; ")})`),
    "",
    "## How it works",
    ...steps.map((p) => `${Number(p.step)}. **${p.title}**: ${p.description}`),
    "",
    ...(work.length
      ? ["## Portfolio", ...work.map((w) => `- [${w.title}](${appUrl(`/portfolio/${w.slug}`)}) (${w.sector}): ${w.summary}`), ""]
      : []),
    "## FAQ",
    ...faqs.flatMap((f) => [`### ${f.q}`, f.a, ""]),
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
