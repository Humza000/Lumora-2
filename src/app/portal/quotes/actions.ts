"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireVerifiedClient } from "@/lib/dal";
import { acceptOffer, declineOffer } from "@/lib/quote-accept";
import { PAYMENT_CHOICES } from "@/lib/quote-offer";
import { fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { optionalText } from "@/lib/validation";

const GONE = "This quote is no longer waiting for your reply. Refresh the page to see its latest status.";

/** Accept the confirmed quote: creates the project and the website invoice (full or 50% deposit). */
export async function acceptQuoteOffer(quoteId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireVerifiedClient();
  const choice = z.enum(PAYMENT_CHOICES).safeParse(fd.get("payment"));
  if (!choice.success) return { error: "Choose how you'd like to pay: in full, or a 50% deposit." };
  const projectId = await acceptOffer(quoteId, user.id, choice.data);
  if (!projectId) return { error: GONE };
  revalidatePath("/portal", "layout");
  redirect(`/portal/projects/${projectId}?accepted=1`);
}

const declineSchema = z.object({ reason: optionalText(1000) });

export async function declineQuoteOffer(quoteId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireVerifiedClient();
  const parsed = declineSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  if (!(await declineOffer(quoteId, user.id, parsed.data.reason))) return { error: GONE };
  revalidatePath("/portal", "layout");
  redirect(`/portal/quotes/${quoteId}?declined=1`);
}
