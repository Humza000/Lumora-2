import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { formatGBP } from "@/lib/money";
import { calculateEstimate, formatEstimate, quoteDraftSchema } from "@/lib/pricing";
import { getPriceMap } from "@/lib/prices";

export const metadata: Metadata = { title: "Quote received" };

export default async function QuoteThanksPage({ searchParams }: PageProps<"/quote/thanks">) {
  const user = await requireClient();
  const { id } = await searchParams;
  const quote = typeof id === "string" ? await db.quote.findFirst({ where: { id, userId: user.id } }) : null;
  if (!quote) notFound();
  const answers = quoteDraftSchema.safeParse(quote.answers);
  const estimate = calculateEstimate(answers.success ? answers.data : {}, await getPriceMap());

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-strong text-2xl text-on-brand shadow-[0_0_40px_color-mix(in_oklab,var(--brand)_70%,transparent)]" aria-hidden>
        ✓
      </div>
      <h1 className="mt-8 font-display text-5xl font-semibold tracking-tight">Thanks, we&apos;ve got your request</h1>
      <p className="mt-4 text-ink-muted">
        Your indicative one-time development cost is{" "}
        <strong className="text-ink">{formatEstimate(quote.estimateMin, quote.estimateMax)}</strong>
        {estimate.monthlyHosting > 0 && (
          <>
            , plus <strong className="text-ink">{formatGBP(estimate.monthlyHosting, { whole: true })}/month</strong> for{" "}
            {estimate.hostingPlan?.label.toLowerCase()}
          </>
        )}
        . We&apos;ll review your requirements and confirm the final price before any work begins, usually within 2 working
        days.
      </p>
      <ol className="mx-auto mt-10 max-w-md space-y-4 text-left text-sm">
        {[
          ["We review your request", "A real person reads every answer, usually within 2 working days."],
          ["You get a tailored proposal", "A fixed scope, timeline and price, with no obligation."],
          ["We start building", "You follow every milestone live in your client portal."],
        ].map(([title, text], i) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-light" aria-hidden>
              {i + 1}
            </span>
            <span>
              <span className="block font-medium">{title}</span>
              <span className="text-ink-muted">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <ButtonLink href="/portal" className="mt-10">
        Go to your portal
      </ButtonLink>
    </div>
  );
}
