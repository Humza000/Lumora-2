import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description: "Website design, development, e-commerce and hosting & care plans from Lumora.",
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <p className="text-sm font-medium text-brand">Services</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
        Premium websites, built to perform
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">
        From a single high-converting landing page to full e-commerce and custom web apps, we design, build, host and
        care for websites that grow your business.
      </p>
      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {services.map((s) => (
          <div key={s.title} className="rounded-2xl border border-line bg-surface p-8">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <p className="mt-3 text-ink-muted">{s.description}</p>
            <ul className="mt-6 space-y-2 text-sm">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-brand" aria-hidden>✓</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <ButtonLink href="/quote" size="lg">
          Get an instant quote
        </ButtonLink>
      </div>
    </div>
  );
}
