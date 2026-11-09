import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { formatGBP } from "@/lib/money";

export const metadata: Metadata = { title: "Quote received" };

export default async function QuoteThanksPage({ searchParams }: PageProps<"/quote/thanks">) {
  const user = await requireClient();
  const { id } = await searchParams;
  const quote = typeof id === "string" ? await db.quote.findFirst({ where: { id, userId: user.id } }) : null;
  if (!quote) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-light to-brand text-2xl text-canvas shadow-[0_0_40px_rgba(165,119,255,0.7)]" aria-hidden>
        ✓
      </div>
      <h1 className="mt-8 font-display text-5xl font-semibold tracking-tight">Thanks, we&apos;ve got your request</h1>
      <p className="mt-4 text-ink-muted">
        Your indicative estimate is{" "}
        <strong className="text-ink">
          {formatGBP(quote.estimateMin, { whole: true })} – {formatGBP(quote.estimateMax, { whole: true })}
        </strong>
        . We&apos;ll review your requirements and get back to you within 2 working days with a tailored proposal.
      </p>
      <ButtonLink href="/portal/quotes" className="mt-8">
        Go to your portal
      </ButtonLink>
    </div>
  );
}
