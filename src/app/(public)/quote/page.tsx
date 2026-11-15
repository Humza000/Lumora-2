import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireVerifiedClient } from "@/lib/dal";
import { getPriceMap } from "@/lib/prices";
import { EMPTY_DRAFT, featuresForType, quoteDraftSchema } from "@/lib/pricing";
import { QuoteWizard } from "./quote-wizard";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Get a quote" };

export default async function QuotePage({ searchParams }: PageProps<"/quote">) {
  const user = await requireVerifiedClient("/quote");
  const { changes } = await searchParams;
  // "Request changes" on a quote we sent: edit that quote's answers instead of starting a new one.
  const sent = typeof changes === "string" ? await db.quote.findFirst({ where: { id: changes, userId: user.id, status: "SENT" } }) : null;
  if (typeof changes === "string" && !sent) redirect("/portal/quotes");

  const [draft, prices, profile] = await Promise.all([
    sent ?? db.quote.findFirst({ where: { userId: user.id, status: "DRAFT" }, orderBy: { updatedAt: "desc" } }),
    getPriceMap(),
    db.clientProfile.findUnique({ where: { userId: user.id } }),
  ]);

  const saved = draft ? quoteDraftSchema.safeParse(draft.answers) : null;
  const restored = saved?.success ? saved.data : {};
  const initial = {
    ...EMPTY_DRAFT,
    businessName: profile?.company ?? "",
    ...restored,
    // Drop options that no longer exist (e.g. from drafts saved before the catalogue changed).
    features: featuresForType(restored.projectType, restored.features),
  };

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="absolute -top-32 left-0 -z-10 h-96 w-96 rounded-full bg-brand/30 blur-[120px]" aria-hidden />
      <Eyebrow>{sent ? "Request changes" : "Quote wizard"}</Eyebrow>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight md:text-6xl">
        {sent ? "Change your quote" : <>Let&apos;s scope your project</>}
      </h1>
      <p className="mt-4 text-lg text-ink-muted">
        {sent
          ? "Go through your answers and change anything you like, then tell us what you'd like different on the last step. We'll send you an updated quote."
          : "Answer a few questions and see your estimate update live. Your progress is saved automatically."}
      </p>
      {sent && (
        <p className="mt-3 text-sm">
          <Link href={`/portal/quotes/${sent.id}`} className="text-brand-light hover:underline">
            ← Back to your quote without changing anything
          </Link>
        </p>
      )}
      <QuoteWizard initialDraft={initial} initialQuoteId={sent ? null : (draft?.id ?? null)} prices={prices} changesFor={sent?.id} />
    </div>
  );
}
