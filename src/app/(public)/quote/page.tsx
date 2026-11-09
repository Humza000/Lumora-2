import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireVerifiedClient } from "@/lib/dal";
import { getPriceMap } from "@/lib/prices";
import { EMPTY_DRAFT, quoteDraftSchema } from "@/lib/pricing";
import { QuoteWizard } from "./quote-wizard";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Get a quote" };

export default async function QuotePage() {
  const user = await requireVerifiedClient("/quote");
  const [draft, prices, profile] = await Promise.all([
    db.quote.findFirst({ where: { userId: user.id, status: "DRAFT" }, orderBy: { updatedAt: "desc" } }),
    getPriceMap(),
    db.clientProfile.findUnique({ where: { userId: user.id } }),
  ]);

  const saved = draft ? quoteDraftSchema.safeParse(draft.answers) : null;
  const initial = {
    ...EMPTY_DRAFT,
    businessName: profile?.company ?? "",
    ...(saved?.success ? saved.data : {}),
  };

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="absolute -top-32 left-0 -z-10 h-96 w-96 rounded-full bg-brand/30 blur-[120px]" aria-hidden />
      <Eyebrow>Quote wizard</Eyebrow>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight md:text-6xl">Let&apos;s scope your project</h1>
      <p className="mt-4 text-lg text-ink-muted">
        Answer a few questions and see your estimate update live. Your progress is saved automatically.
      </p>
      <QuoteWizard initialDraft={initial} initialQuoteId={draft?.id ?? null} prices={prices} />
    </div>
  );
}
