import type { Metadata } from "next";
import { Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Lumora is a boutique web design and development studio for ambitious brands.",
};

const values = [
  { title: "Quality over quantity", description: "We take on a limited number of projects so each one gets our full attention." },
  { title: "Built to convert", description: "Beautiful is the baseline. Every design decision is made to win you customers." },
  { title: "Total transparency", description: "Clear pricing, and a client portal where you can follow progress at every stage." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      {/* TODO: replace with Lumora's own story */}
      <PageHero eyebrow="About Lumora" title="A boutique studio for brands that refuse to settle for ordinary">
        Lumora designs and builds premium, high-performance websites for ambitious businesses, from local trades and
        independent cafés to e-commerce brands and professional firms. We combine considered design with modern
        engineering to create sites that look exceptional and deliver measurable results.
      </PageHero>
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {values.map((v, i) => (
          <Reveal key={v.title} delay={i * 120} className="flex">
            <Card interactive className="w-full p-8">
              <span className="font-display text-5xl text-brand-light/40">0{i + 1}</span>
              <h2 className="mt-4 text-lg font-semibold">{v.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{v.description}</p>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-20">
        <ButtonLink href="/quote" size="lg">
          Work with us <span aria-hidden>→</span>
        </ButtonLink>
      </Reveal>
    </div>
  );
}
