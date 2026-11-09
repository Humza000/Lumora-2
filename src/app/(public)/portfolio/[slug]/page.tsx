import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    <article className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <Link href="/portfolio" className="text-sm text-ink-muted hover:text-ink">
        ← All projects
      </Link>
      <p className="mt-8 text-sm font-medium tracking-wide text-brand uppercase">{item.sector}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{item.title}</h1>
      <p className="mt-4 text-xl text-ink-muted">{item.summary}</p>

      <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-ink">
        {item.imageUrl && <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized />}
      </div>

      <div className="mt-12 grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          {item.body ? (
            <div className="space-y-4 whitespace-pre-line text-ink-muted">{item.body}</div>
          ) : (
            <p className="text-ink-muted">{item.summary}</p>
          )}
        </div>
        <aside>
          <h2 className="text-sm font-semibold">Key features</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {item.features.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-brand" aria-hidden>✓</span>
                {f}
              </li>
            ))}
          </ul>
          {item.liveUrl && (
            <a href={item.liveUrl} target="_blank" rel="noreferrer" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
              Visit live site ↗
            </a>
          )}
        </aside>
      </div>

      <div className="mt-20 rounded-2xl border border-line bg-surface p-10 text-center">
        <h2 className="text-2xl font-semibold">Want results like this?</h2>
        <p className="mt-2 text-ink-muted">Tell us about your project and get an instant estimate.</p>
        <ButtonLink href="/quote" className="mt-6">
          Start your quote
        </ButtonLink>
      </div>
    </article>
  );
}
