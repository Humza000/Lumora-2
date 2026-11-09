import Link from "next/link";
import { connection } from "next/server";
import { ButtonLink } from "@/components/ui";
import { PortfolioCard } from "@/components/portfolio-card";
import { db } from "@/lib/db";
import { process, services } from "@/lib/content";
import { site } from "@/lib/site";

export default async function HomePage() {
  await connection();
  const featured = await db.portfolioItem.findMany({
    where: { published: true, featured: true },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--brand-soft),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 md:pt-28">
          <p className="mb-6 inline-flex rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
            Boutique web design & development studio
          </p>
          <h1 className="max-w-4xl text-5xl leading-[1.05] font-semibold tracking-tight md:text-7xl">
            We build websites that <span className="text-brand">convert.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-muted">
            {site.name} crafts premium, high-performance web experiences for ambitious brands that want more than
            average results.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/quote" size="lg">
              Get an instant quote
            </ButtonLink>
            <ButtonLink href="/portfolio" variant="secondary" size="lg">
              See our work
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand">Selected work</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Websites that work as hard as you do</h2>
          </div>
          <Link href="/portfolio" className="hidden text-sm font-medium text-brand hover:underline sm:block">
            View all projects →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6">
        <p className="text-sm font-medium text-brand">What we do</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">
          Everything you need to win online, under one roof
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div key={s.title} className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="mt-28 bg-ink py-24 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-medium text-accent">How it works</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">
            A clear process, and full visibility at every step
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-4">
            {process.map((p) => (
              <div key={p.step}>
                <p className="font-mono text-sm text-accent">{p.step}</p>
                <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-white/70">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-brand px-8 py-16 text-center text-white md:px-16">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Ready to build something exceptional?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Get an indicative price in minutes with our quote wizard. No obligation, no hard sell.
          </p>
          <Link
            href="/quote"
            className="mt-8 inline-flex rounded-lg bg-white px-6 py-3.5 font-medium text-ink transition-opacity hover:opacity-90"
          >
            Start your quote
          </Link>
        </div>
      </section>
    </>
  );
}
