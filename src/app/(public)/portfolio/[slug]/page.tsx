import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMockup } from "@/components/mockups";
import { BrowserFrame, PhoneFrame } from "@/components/mockups/frames";
import { Reveal } from "@/components/motion";
import { Badge, ButtonLink, Card, Eyebrow } from "@/components/ui";
import { db } from "@/lib/db";
import { readStats } from "@/lib/portfolio";

async function getItem(slug: string) {
  return db.portfolioItem.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const item = await getItem((await params).slug);
  return item ? { title: `${item.title}: case study`, description: item.summary } : {};
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      <div className="mt-4 text-lg leading-relaxed text-ink-muted">{children}</div>
    </Reveal>
  );
}

export default async function CaseStudyPage({ params }: PageProps<"/portfolio/[slug]">) {
  const item = await getItem((await params).slug);
  if (!item) notFound();

  const mockup = getMockup(item.mockup);
  const stats = readStats(item.stats);
  const others = await db.portfolioItem.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    select: { slug: true, title: true, sector: true },
  });
  const idx = others.findIndex((o) => o.slug === item.slug);
  const next = others.length > 1 ? others[(idx + 1) % others.length] : null;

  const meta = [
    ["Client", item.client ?? item.title],
    ["Industry", item.sector],
    ["Location", item.location],
    ["Year", item.year?.toString()],
  ].filter((m): m is [string, string] => Boolean(m[1]));

  return (
    <article className="relative isolate mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="absolute -top-40 right-0 -z-10 h-96 w-96 rounded-full bg-brand/25 blur-[120px]" aria-hidden />
      <Link href="/portfolio" className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-brand-light">
        <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-1">←</span> All projects
      </Link>

      {/* Hero */}
      <Reveal className="mt-10 max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-medium tracking-[0.2em] text-brand-light uppercase">{item.sector}</p>
          {item.concept && <Badge tone="brand">Concept project</Badge>}
        </div>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-7xl">{item.title}</h1>
        <p className="mt-5 text-xl leading-relaxed text-ink-muted">{item.summary}</p>
      </Reveal>

      <Reveal delay={80}>
        <dl className="mt-10 grid gap-6 border-y border-line py-6 sm:grid-cols-2 lg:grid-cols-[repeat(4,auto)_1fr] lg:gap-10">
          {meta.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs tracking-[0.15em] text-ink-muted uppercase">{k}</dt>
              <dd className="mt-1 font-medium">{v}</dd>
            </div>
          ))}
          {item.services.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-1">
              <dt className="text-xs tracking-[0.15em] text-ink-muted uppercase">Services</dt>
              <dd className="mt-1 font-medium">{item.services.join(" · ")}</dd>
            </div>
          )}
        </dl>
      </Reveal>

      {/* Desktop visual */}
      <Reveal delay={120} className="mt-12">
        {mockup ? (
          <BrowserFrame url={mockup.url}>
            <mockup.Desktop />
          </BrowserFrame>
        ) : item.imageUrl ? (
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line">
            <Image src={item.imageUrl} alt={`${item.title} website`} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="bg-mesh aspect-[16/10] rounded-2xl border border-line" />
        )}
        {mockup && <p className="mt-3 text-center text-sm text-ink-muted">Homepage, desktop</p>}
      </Reveal>

      {/* Who / brief */}
      {(item.overview || item.challenge) && (
        <div className="mt-24 grid gap-14 md:grid-cols-2">
          {item.overview && (
            <Section eyebrow="The client" title="Who it's for">
              <p>{item.overview}</p>
            </Section>
          )}
          {item.challenge && (
            <Section eyebrow="The brief" title="The challenge">
              <p>{item.challenge}</p>
            </Section>
          )}
        </div>
      )}

      {item.approach && (
        <div className="mt-20 max-w-3xl">
          <Section eyebrow="Our approach" title="What we did">
            <p>{item.approach}</p>
          </Section>
        </div>
      )}

      {/* Mobile + detail visuals */}
      {mockup && (
        <div className="mt-20 grid items-end gap-10 md:grid-cols-[minmax(0,16rem)_1fr]">
          <Reveal className="mx-auto w-full max-w-64">
            <PhoneFrame>
              <mockup.Mobile />
            </PhoneFrame>
            <p className="mt-3 text-center text-sm text-ink-muted">Mobile</p>
          </Reveal>
          <Reveal delay={120}>
            <BrowserFrame url={mockup.url}>
              <mockup.Detail />
            </BrowserFrame>
            <p className="mt-3 text-center text-sm text-ink-muted">{mockup.detailCaption}</p>
          </Reveal>
        </div>
      )}

      {/* Features + outcomes */}
      <div className="mt-24 grid gap-8 md:grid-cols-2">
        {item.features.length > 0 && (
          <Reveal className="flex">
            <Card className="w-full p-8">
              <h2 className="font-display text-3xl font-semibold">Key features</h2>
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {item.features.map((f) => (
                  <li key={f} className="rounded-full border border-line bg-surface-2/60 px-3.5 py-1.5 text-sm">
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        )}
        {item.outcomes.length > 0 && (
          <Reveal delay={100} className="flex">
            <Card className="w-full p-8">
              <h2 className="font-display text-3xl font-semibold">What we delivered</h2>
              <ul className="mt-6 space-y-3.5">
                {item.outcomes.map((o) => (
                  <li key={o} className="flex gap-3 leading-relaxed text-ink-muted">
                    <span
                      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] text-brand-light ring-1 ring-brand/30"
                      aria-hidden
                    >
                      ✓
                    </span>
                    {o}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        )}
      </div>

      {/* Real results + testimonial: only rendered when entered in the admin */}
      {stats.length > 0 && (
        <Reveal className="mt-16">
          <Eyebrow>Results</Eyebrow>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="text-center">
                <p className="text-gradient font-display text-5xl font-semibold">{s.value}</p>
                <p className="mt-2 text-sm text-ink-muted">{s.label}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      )}

      {item.testimonialQuote && (
        <Reveal className="mt-16">
          <figure className="ring-gradient relative isolate overflow-hidden rounded-3xl border border-line bg-surface p-10 md:p-14">
            <div className="absolute -top-20 -left-20 -z-10 h-64 w-64 rounded-full bg-brand-tint/50 blur-[90px]" aria-hidden />
            <blockquote className="font-display text-3xl leading-snug md:text-4xl">“{item.testimonialQuote}”</blockquote>
            {item.testimonialAuthor && (
              <figcaption className="mt-6 text-ink-muted">
                <span className="font-medium text-ink">{item.testimonialAuthor}</span>
                {item.testimonialRole && `, ${item.testimonialRole}`}
              </figcaption>
            )}
          </figure>
        </Reveal>
      )}

      {item.body && (
        <div className="mt-16 max-w-3xl space-y-4 text-lg leading-relaxed whitespace-pre-line text-ink-muted">{item.body}</div>
      )}

      {item.liveUrl && (
        <a href={item.liveUrl} target="_blank" rel="noreferrer" className="mt-10 inline-block font-medium text-brand-light hover:underline">
          Visit the live site ↗
        </a>
      )}

      {/* Next project */}
      {next && (
        <Reveal className="mt-24">
          <Link href={`/portfolio/${next.slug}`} className="group flex items-center justify-between gap-6 border-t border-line pt-8">
            <div>
              <p className="text-xs tracking-[0.2em] text-ink-muted uppercase">Next project</p>
              <p className="mt-2 font-display text-4xl font-semibold transition-colors group-hover:text-brand-light">{next.title}</p>
              <p className="mt-1 text-sm text-ink-muted">{next.sector}</p>
            </div>
            <span aria-hidden className="text-3xl text-brand-light transition-transform duration-300 group-hover:translate-x-2">
              →
            </span>
          </Link>
        </Reveal>
      )}

      <Reveal>
        <div className="ring-gradient relative isolate mt-20 overflow-hidden rounded-3xl border border-line/60 bg-surface/80 p-12 text-center">
          <div className="absolute -bottom-24 left-1/2 -z-10 h-64 w-96 -translate-x-1/2 rounded-full bg-brand/30 blur-[90px]" aria-hidden />
          <h2 className="font-display text-4xl font-semibold">Want results like this?</h2>
          <p className="mt-3 text-ink-muted">Tell us about your project and get an instant estimate.</p>
          <ButtonLink href="/quote" size="lg" className="mt-8">
            Start your quote <span aria-hidden>→</span>
          </ButtonLink>
        </div>
      </Reveal>
    </article>
  );
}
