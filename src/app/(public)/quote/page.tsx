import type { Metadata } from "next";
import { QuoteWizard } from "@/components/quote-wizard";
import { Eyebrow } from "@/components/ui";
import { buildSafe } from "@/lib/build-safe";
import { getPriceMap } from "@/lib/prices";
import { DEFAULT_PRICES, EMPTY_DRAFT } from "@/lib/pricing";

export const metadata: Metadata = { title: "Get a quote", robots: { index: false } };

// Pre-built like the other public pages; prices refresh hourly. Signed-in clients never see this
// page: proxy.ts sends them to the same wizard inside the portal (/portal/quote).
export const revalidate = 3600;

export default async function QuotePage() {
  const prices = await buildSafe(getPriceMap, DEFAULT_PRICES);
  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div
        className="absolute -top-32 left-0 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_30%,transparent),transparent)]"
        aria-hidden
      />
      <Eyebrow>Quote wizard</Eyebrow>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight md:text-6xl">Let&apos;s scope your project</h1>
      <p className="mt-4 text-lg text-ink-muted">
        Answer a few questions and see your estimate update live. No account needed until you send it.
      </p>
      <QuoteWizard mode="guest" initialDraft={EMPTY_DRAFT} initialQuoteId={null} prices={prices} />
    </div>
  );
}
