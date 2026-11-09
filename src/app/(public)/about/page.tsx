import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";

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
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="text-sm font-medium text-brand">About Lumora</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
        A boutique studio for brands that refuse to settle for ordinary
      </h1>
      {/* TODO: replace with Lumora's own story */}
      <p className="mt-6 max-w-2xl text-lg text-ink-muted">
        Lumora designs and builds premium, high-performance websites for ambitious businesses, from local trades and
        independent cafés to e-commerce brands and professional firms. We combine considered design with modern
        engineering to create sites that look exceptional and deliver measurable results.
      </p>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {values.map((v) => (
          <div key={v.title} className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-semibold">{v.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{v.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-16">
        <ButtonLink href="/quote" size="lg">
          Work with us
        </ButtonLink>
      </div>
    </div>
  );
}
