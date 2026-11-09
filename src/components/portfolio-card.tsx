import Image from "next/image";
import Link from "next/link";
import { getMockup } from "./mockups";
import { MockCanvas } from "./mockups/frames";
import { Spotlight } from "./motion";

type Item = {
  slug: string;
  title: string;
  sector: string;
  summary: string;
  features: string[];
  imageUrl: string | null;
  mockup?: string | null;
  location?: string | null;
  year?: number | null;
};

export function PortfolioCard({ item }: { item: Item }) {
  const mockup = getMockup(item.mockup);
  return (
    <Link href={`/portfolio/${item.slug}`} className="group flex w-full rounded-2xl">
      <Spotlight className="ring-gradient flex w-full flex-col overflow-hidden rounded-2xl border border-line/60 bg-surface/80 transition-all duration-500 hover:-translate-y-1.5 hover:border-brand-light/30 hover:shadow-[0_30px_60px_-25px_rgba(165,119,255,0.6)]">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-line/60 bg-surface-2">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              unoptimized
            />
          ) : mockup ? (
            <div className="origin-top transition-transform duration-700 ease-out group-hover:scale-[1.04]">
              <MockCanvas>
                <mockup.Desktop />
              </MockCanvas>
            </div>
          ) : (
            <div className="bg-mesh absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.08]" />
          )}
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-[11px] font-medium tracking-[0.18em] text-brand-light uppercase">{item.sector}</p>
          <h3 className="mt-2 font-display text-2xl font-semibold">{item.title}</h3>
          {(item.location || item.year) && (
            <p className="mt-0.5 text-xs text-ink-muted">{[item.location, item.year].filter(Boolean).join(" · ")}</p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.summary}</p>
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
