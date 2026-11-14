import { faqs, reviews } from "@/lib/content";
import { Reveal } from "./motion";
import { Eyebrow } from "./ui";

/**
 * Client reviews (only when real ones exist in content.ts) followed by the FAQ accordion
 * (native <details>, so it works without JS) + FAQPage structured data for search.
 */
export function FaqSection() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <section id="faq" className="mx-auto mt-36 max-w-3xl scroll-mt-28 px-4 sm:px-6">
      {reviews.length > 0 && (
        <div className="mb-24">
          <Reveal className="text-center">
            <Eyebrow>Reviews</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">What our clients say</h2>
          </Reveal>
          <div className={reviews.length > 1 ? "mt-12 grid gap-4 sm:grid-cols-2" : "mt-12"}>
            {reviews.map((r, i) => (
              <Reveal key={r.name + i} delay={i * 80} className="flex">
                <figure className="flex w-full flex-col rounded-2xl border border-line/70 bg-surface p-6">
                  <span className="font-display text-5xl leading-none text-brand-tint" aria-hidden>
                    &ldquo;
                  </span>
                  <blockquote className="-mt-2 flex-1 leading-relaxed text-ink">{r.quote}</blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="font-medium">{r.name}</span>
                    {r.role && <span className="block text-ink-muted">{r.role}</span>}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      )}
      <Reveal className="text-center">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">Frequently Asked Questions</h2>
      </Reveal>
      <div className="mt-12 space-y-3">
        {faqs.map((f, i) => (
          <Reveal key={f.q} delay={i * 60}>
            <details className="group ring-gradient rounded-2xl border border-line/70 bg-surface/80 shadow-[0_1px_2px_color-mix(in_oklab,var(--ink)_4%,transparent)] transition-all duration-300 hover:border-brand/40 hover:shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--brand-strong)_35%,transparent)] open:border-brand/40 open:bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-light transition-all duration-300 group-hover:bg-brand group-hover:text-on-brand group-open:rotate-45 group-open:bg-brand group-open:text-on-brand"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M7 1v12M1 7h12" />
                  </svg>
                </span>
              </summary>
              <p className="animate-[fade-in_0.4s_ease] px-6 pb-6 leading-relaxed text-ink-muted">{f.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </section>
  );
}
