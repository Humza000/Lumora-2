import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireVerifiedClient } from "@/lib/dal";
import { getPriceMap } from "@/lib/prices";
import { EMPTY_DRAFT, quoteDraftSchema } from "@/lib/pricing";
import { QuoteWizard } from "./quote-wizard";

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
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="text-sm font-medium text-brand">Quote wizard</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Let&apos;s scope your project</h1>
      <p className="mt-2 text-ink-muted">
        Answer a few questions and see your estimate update live. Your progress is saved automatically.
      </p>
      <QuoteWizard initialDraft={initial} initialQuoteId={draft?.id ?? null} prices={prices} />
    </div>
  );
}
