import Image from "next/image";
import Link from "next/link";

type Item = { slug: string; title: string; sector: string; summary: string; features: string[]; imageUrl: string | null };

export function PortfolioCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/portfolio/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand to-ink">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-end p-6">
            <span className="text-2xl font-semibold text-white/90">{item.title}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium tracking-wide text-brand uppercase">{item.sector}</p>
        <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
        <p className="mt-2 text-sm text-ink-muted">{item.summary}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {item.features.slice(0, 3).map((f) => (
            <li key={f} className="rounded-full bg-canvas px-2.5 py-1 text-xs text-ink-muted">
              {f}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
