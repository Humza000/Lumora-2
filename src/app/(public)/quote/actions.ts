"use server";

import { redirect } from "next/navigation";
import { createClientAccount } from "@/lib/accounts";
import { fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { emails } from "@/lib/email";
import { getPriceMap } from "@/lib/prices";
import { calculateEstimate, quoteAnswersSchema } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Guest wizard, last step: creates the account and submits the quote in one go. The quote is
 * sent straight away; the verification email goes out alongside it.
 */
export async function signupAndSubmitQuote(_: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("company_website")) return { error: "Something went wrong. Please try again." }; // honeypot
  if (!(await rateLimit("signup", 5, 60 * 60 * 1000)).ok) {
    return { error: "Too many sign-up attempts. Please try again later." };
  }

  let rawAnswers: unknown;
  try {
    rawAnswers = JSON.parse(String(formData.get("answers") ?? ""));
  } catch {
    rawAnswers = null;
  }
  const answers = quoteAnswersSchema.safeParse(rawAnswers);
  if (!answers.success) {
    return { error: answers.error.issues[0]?.message ?? "Please complete all the steps of the quote first." };
  }

  const parsed = signupSchema.safeParse({ ...formToObject(formData), company: answers.data.businessName });
  if (!parsed.success) return fromZodError(parsed.error);

  // Never trust a client-side estimate: always recompute on the server.
  const estimate = calculateEstimate(answers.data, await getPriceMap());
  const account = await createClientAccount(parsed.data, {
    next: "/portal",
    quote: {
      answers: answers.data as Prisma.InputJsonValue,
      estimateMin: estimate.min,
      estimateMax: estimate.max,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
  if (!account?.quoteId) {
    return { error: "An account with this email already exists. Log in to send your quote, your answers are kept." };
  }

  await Promise.all([
    emails.quoteReceived(account.user.email, account.user.name, estimate),
    emails.adminNewQuote(account.quoteId, account.user.name, answers.data.businessName),
  ]);
  redirect(`/portal/quote/thanks?id=${account.quoteId}`);
}
