import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion";
import { ButtonLink } from "@/components/ui";
import { db } from "@/lib/db";

async function getItem(slug: string) {
  return db.portfolioItem.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const item = await getItem((await params).slug);
  return item ? { title: item.title, description: item.summary } : {};
}

export default async function CaseStudyPage({ params }: PageProps<"/portfolio/[slug]">) {
  const item = await getItem((await params).slug);
  if (!item) notFound();

  return (
    <article className="relative isolate mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <div className="absolute -top-40 right-0 -z-10 h-96 w-96 rounded-full bg-brand/30 blur-[120px]" aria-hidden />
      <Link href="/portfolio" className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-brand-light">
        <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-1">←</span> All projects
      </Link>
      <Reveal>
        <p className="mt-10 text-xs font-medium tracking-[0.2em] text-brand-light uppercase">{item.sector}</p>
        <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight md:text-7xl">{item.title}</h1>
        <p className="mt-5 max-w-3xl text-xl leading-relaxed text-ink-muted">{item.summary}</p>
      </Reveal>

      <Reveal delay={120}>
        <div className="group ring-gradient relative mt-12 aspect-[16/9] overflow-hidden rounded-3xl border border-line/60 shadow-[0_40px_80px_-40px_rgba(165,119,255,0.6)]">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]" unoptimized />
          ) : (
            <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-[1.04]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,#a577ff_0%,transparent_50%),radial-gradient(circle_at_80%_75%,#6b46d9_0%,transparent_45%),linear-gradient(135deg,#2a1a66,#150a35)]" />
              <div className="bg-grid absolute inset-0 opacity-60" />
              <span className="absolute inset-0 flex items-center justify-center font-display text-5xl text-accent/80 md:text-7xl">{item.title}</span>
            </div>
          )}
        </div>
      </Reveal>

      <div className="mt-16 grid gap-12 md:grid-cols-3">
        <Reveal className="md:col-span-2">
          {item.body ? (
            <div className="space-y-4 text-lg leading-relaxed whitespace-pre-line text-ink-muted">{item.body}</div>
          ) : (
            <p className="text-lg leading-relaxed text-ink-muted">{item.summary}</p>
          )}
        </Reveal>
        <Reveal delay={120} as="aside" className="glass h-fit rounded-2xl p-6">
          <h2 className="text-xs font-medium tracking-[0.2em] text-ink uppercase">Key features</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-muted">
            {item.features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-strong/20 text-[10px] text-brand-light ring-1 ring-brand-light/30" aria-hidden>✓</span>
                {f}
              </li>
            ))}
          </ul>
          {item.liveUrl && (
            <a href={item.liveUrl} target="_blank" rel="noreferrer" className="mt-6 inline-block text-sm font-medium text-brand-light hover:underline">
              Visit live site ↗
            </a>
          )}
        </Reveal>
      </div>

      <Reveal>
        <div className="ring-gradient relative isolate mt-24 overflow-hidden rounded-3xl border border-line/60 bg-surface/80 p-12 text-center">
          <div className="absolute -bottom-24 left-1/2 -z-10 h-64 w-96 -translate-x-1/2 rounded-full bg-brand/35 blur-[90px]" aria-hidden />
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
