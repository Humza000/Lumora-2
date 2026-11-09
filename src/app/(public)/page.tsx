import Link from "next/link";
import { connection } from "next/server";
import { FaqSection } from "@/components/faq";
import { FlowBackground } from "@/components/flow-background";
import { Reveal, Spotlight } from "@/components/motion";
import { PortfolioCard } from "@/components/portfolio-card";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { db } from "@/lib/db";
import { process, services } from "@/lib/content";
import { site } from "@/lib/site";

const SECTORS = ["Fitness", "E-commerce", "Legal", "Hospitality", "Healthcare", "Trades", "Professional services", "Retail"];

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
      <section className="relative isolate -mt-[76px] overflow-hidden pt-[76px]">
        <FlowBackground />

        <div className="mx-auto max-w-6xl px-4 pt-24 pb-28 sm:px-6 md:pt-32 md:pb-36">
          <Reveal>
            <p className="glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light shadow-[0_0_10px_#cbb5ff]" />
              Boutique web design & development studio
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="max-w-5xl font-display text-6xl leading-[0.98] font-semibold tracking-tight md:text-8xl">
              We build websites that{" "}
              <span className="text-gradient animate-shimmer italic">convert.</span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-muted md:text-xl">
              {site.name} crafts premium, high-performance web experiences for ambitious brands that want more than
              average results.
            </p>
          </Reveal>
          <Reveal delay={300} className="mt-12 flex flex-wrap gap-4">
            <ButtonLink href="/quote" size="lg">
              Get an instant quote <span aria-hidden>→</span>
            </ButtonLink>
            <ButtonLink href="/portfolio" variant="secondary" size="lg">
              See our work
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      {/* Sector marquee */}
      <section className="relative border-y border-line/50 py-6" aria-label="Industries we work with">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_15%,#000_85%,transparent)]">
          <div className="flex shrink-0 animate-[marquee_40s_linear_infinite] gap-12 pr-12 hover:[animation-play-state:paused]">
            {[...SECTORS, ...SECTORS].map((s, i) => (
              <span key={i} className="flex items-center gap-12 font-display text-2xl whitespace-nowrap text-ink-muted/70">
                {s}
                <span className="text-brand-light/50" aria-hidden>✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6">
        <Reveal className="mb-12 flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Selected work</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Websites that work as hard as you do
            </h2>
          </div>
          <Link
            href="/portfolio"
            className="group hidden items-center gap-1.5 text-sm font-medium text-brand-light sm:inline-flex"
          >
            View all projects
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((item, i) => (
            <Reveal key={item.id} delay={i * 120} className="flex">
              <PortfolioCard item={item} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto mt-36 max-w-6xl px-4 sm:px-6">
        <Reveal>
          <Eyebrow>What we do</Eyebrow>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Everything you need to win online, under one roof
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 100} className="flex">
              <Spotlight className="group ring-gradient flex w-full flex-col rounded-2xl border border-line/60 bg-surface/80 p-7 transition-all duration-500 hover:-translate-y-1 hover:border-brand-light/30 hover:shadow-[0_24px_50px_-25px_rgba(165,119,255,0.7)]">
                <span className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-light/20 bg-brand-strong/15 font-display text-lg text-brand-light transition-all duration-500 group-hover:bg-brand-strong/30 group-hover:shadow-[0_0_24px_rgba(165,119,255,0.6)]">
                  0{i + 1}
                </span>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{s.description}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="relative isolate mt-36 overflow-hidden border-y border-line/50 py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-soft/60 via-canvas to-canvas" aria-hidden />
        <div className="absolute top-0 left-1/2 -z-10 h-72 w-[50rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]" aria-hidden />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
              A clear process, and full visibility at every step
            </h2>
          </Reveal>
          <div className="relative mt-16 grid gap-12 md:grid-cols-4 md:gap-8">
            <div
              className="absolute top-5 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-brand-light/0 via-brand-light/60 to-brand-light/0 md:block"
              aria-hidden
            />
            {process.map((p, i) => (
              <Reveal key={p.step} delay={i * 150} className="group relative">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-light/40 bg-canvas font-mono text-xs text-brand-light shadow-[0_0_20px_rgba(165,119,255,0.45)] transition-all duration-500 group-hover:scale-110 group-hover:bg-brand group-hover:text-ink">
                  {p.step}
                </span>
                <h3 className="mt-6 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FaqSection />

      {/* CTA */}
      <section className="mx-auto mt-32 max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="group relative isolate overflow-hidden rounded-[2rem] border border-brand-light/20 px-8 py-20 text-center md:px-16">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#8b5cff] via-[#4b2a9e] to-[#1c1042]" aria-hidden />
            <div
              className="absolute -top-32 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-[#cbb5ff]/30 blur-[100px] transition-transform duration-1000 group-hover:scale-125"
              aria-hidden
            />
            <h2 className="font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Ready to build something exceptional?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/75">
              Get an indicative price in minutes with our quote wizard. No obligation, no hard sell.
            </p>
            <Link
              href="/quote"
              className="shine mt-10 inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 font-medium text-ink shadow-[0_10px_40px_-10px_rgba(248,248,255,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-10px_rgba(248,248,255,0.8)] active:scale-[0.97]"
            >
              Start your quote <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
