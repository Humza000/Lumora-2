"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireVerifiedClient } from "@/lib/dal";
import { emails } from "@/lib/email";
import { getPriceMap } from "@/lib/prices";
import { calculateEstimate, quoteAnswersSchema, quoteDraftSchema } from "@/lib/pricing";
import type { Prisma } from "@/generated/prisma/client";

async function ownedDraft(userId: string, quoteId: string | null) {
  if (!quoteId) return null;
  return db.quote.findFirst({ where: { id: quoteId, userId, status: "DRAFT" } });
}

/** Autosave wizard progress. Returns the draft id. */
export async function saveQuoteDraft(quoteId: string | null, draft: unknown) {
  const user = await requireVerifiedClient();
  const parsed = quoteDraftSchema.safeParse(draft);
  if (!parsed.success) return { quoteId };

  const answers = parsed.data as Prisma.InputJsonValue;
  const estimate = calculateEstimate(parsed.data, await getPriceMap());
  const existing = await ownedDraft(user.id, quoteId);

  const quote = existing
    ? await db.quote.update({
        where: { id: existing.id },
        data: { answers, estimateMin: estimate.min, estimateMax: estimate.max },
      })
    : await db.quote.create({
        data: { userId: user.id, answers, estimateMin: estimate.min, estimateMax: estimate.max },
      });
  return { quoteId: quote.id };
}

export async function submitQuote(quoteId: string | null, answers: unknown) {
  const user = await requireVerifiedClient();
  const parsed = quoteAnswersSchema.safeParse(answers);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please complete all required steps." };
  }

  // Never trust a client-side estimate: always recompute on the server.
  const estimate = calculateEstimate(parsed.data, await getPriceMap());
  const data = {
    answers: parsed.data as Prisma.InputJsonValue,
    estimateMin: estimate.min,
    estimateMax: estimate.max,
    status: "SUBMITTED" as const,
    submittedAt: new Date(),
  };

  const existing = await ownedDraft(user.id, quoteId);
  const quote = existing
    ? await db.quote.update({ where: { id: existing.id }, data })
    : await db.quote.create({ data: { ...data, userId: user.id } });

  await Promise.all([
    emails.quoteReceived(user.email, user.name, estimate),
    emails.adminNewQuote(quote.id, user.name, parsed.data.businessName),
  ]);

  redirect(`/quote/thanks?id=${quote.id}`);
}

/**
 * "Request changes" on a quote we sent: the client's edited answers and note replace the old
 * answers (kept in `previousAnswers` so the admin can see what changed) and the quote comes back
 * to us to re-price and send again.
 */
export async function requestQuoteChanges(quoteId: string, answers: unknown, note: string) {
  const user = await requireVerifiedClient();
  const parsed = quoteAnswersSchema.safeParse(answers);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please complete all required steps." };
  const changeRequest = String(note ?? "").trim().slice(0, 2000);
  if (changeRequest.length < 3) return { error: "Tell us what you'd like changed, so we know what to look at." };

  const quote = await db.quote.findFirst({ where: { id: quoteId, userId: user.id, status: "SENT" } });
  if (!quote) return { error: "This quote is no longer open for changes. Check its latest status in your portal." };

  const estimate = calculateEstimate(parsed.data, await getPriceMap());
  // Conditional on still being SENT, so it can't race with accepting or declining in another tab.
  const { count } = await db.quote.updateMany({
    where: { id: quote.id, userId: user.id, status: "SENT" },
    data: {
      status: "CHANGES_REQUESTED",
      previousAnswers: (quote.answers ?? {}) as Prisma.InputJsonValue,
      answers: parsed.data as Prisma.InputJsonValue,
      estimateMin: estimate.min,
      estimateMax: estimate.max,
      changeRequest,
      respondedAt: new Date(),
    },
  });
  if (count !== 1) return { error: "This quote is no longer open for changes. Check its latest status in your portal." };

  await emails.adminQuoteChangesRequested(quote.id, user.name, changeRequest);
  redirect(`/portal/quotes/${quote.id}?changes=1`);
}
