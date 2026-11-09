import Image from "next/image";
import Link from "next/link";
import { Spotlight } from "./motion";

type Item = { slug: string; title: string; sector: string; summary: string; features: string[]; imageUrl: string | null };

export function PortfolioCard({ item }: { item: Item }) {
  return (
    <Link href={`/portfolio/${item.slug}`} className="group flex w-full rounded-2xl">
      <Spotlight
        className="ring-gradient flex w-full flex-col overflow-hidden rounded-2xl border border-line/60 bg-surface/80 transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-light/30 hover:shadow-[0_30px_60px_-25px_rgba(165,119,255,0.6)]"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.08]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#cbb5ff_0%,transparent_60%),radial-gradient(circle_at_85%_85%,#a577ff_0%,transparent_55%),linear-gradient(135deg,#f4f0ff,#ddd0ff)]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/20 to-transparent" />
          <span className="absolute bottom-5 left-6 font-display text-3xl font-semibold text-ink">{item.title}</span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-[11px] font-medium tracking-[0.18em] text-brand-light uppercase">{item.sector}</p>
          <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.summary}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {item.features.slice(0, 3).map((f) => (
              <li key={f} className="rounded-full border border-line/70 bg-ink/[0.025] px-2.5 py-1 text-xs text-ink-muted">
                {f}
              </li>
            ))}
          </ul>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-brand-light">
            View case study
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </span>
        </div>
      </Spotlight>
      </Link>
  );
}
