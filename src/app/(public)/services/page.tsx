import type { Metadata } from "next";
import { Reveal, Spotlight } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { ButtonLink } from "@/components/ui";
import { services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description: "Website design, development, e-commerce and hosting & care plans from Lumora.",
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <PageHero eyebrow="Services" title="Premium websites, built to perform">
        From a single high-converting landing page to full e-commerce and custom web apps, we design, build, host and
        care for websites that grow your business.
      </PageHero>
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {services.map((s, i) => (
          <Reveal key={s.title} delay={(i % 2) * 120} className="flex">
            <Spotlight className="group ring-gradient w-full rounded-2xl border border-line/60 bg-surface/80 p-9 transition-all duration-500 hover:-translate-y-1 hover:border-brand-light/30 hover:shadow-[0_30px_60px_-30px_rgba(165,119,255,0.7)]">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-3xl font-semibold">{s.title}</h2>
                <span className="font-mono text-xs text-brand-light/70 transition-colors group-hover:text-brand-light">0{i + 1}</span>
              </div>
              <p className="mt-4 leading-relaxed text-ink-muted">{s.description}</p>
              <ul className="mt-7 space-y-3 text-sm">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-strong/20 text-[10px] text-brand-light ring-1 ring-brand-light/30"
                      aria-hidden
                    >
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </Spotlight>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-20 text-center">
        <ButtonLink href="/quote" size="lg">
          Get an instant quote <span aria-hidden>→</span>
        </ButtonLink>
      </Reveal>
    </div>
  );
}
