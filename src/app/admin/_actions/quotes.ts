"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { deleteQuoteAndProject } from "@/lib/delete-records";
import { emails } from "@/lib/email";
import { HOSTING_BILLING, HOSTING_PLANS } from "@/lib/pricing";
import { canSendOffer, offerHosting } from "@/lib/quote-offer";
import { fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { optionalDate, optionalText, pence } from "@/lib/validation";

const reviewSchema = z.object({
  status: z.enum(["SUBMITTED", "REVIEWING", "CHANGES_REQUESTED", "DECLINED"]),
  adminNotes: optionalText(),
});

export async function updateQuoteReview(quoteId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = reviewSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const quote = await db.quote.findUnique({ where: { id: quoteId } });
  // A sent quote is in the client's hands: withdraw it first.
  if (!quote || !["SUBMITTED", "REVIEWING", "CHANGES_REQUESTED", "DECLINED"].includes(quote.status)) return { error: "This quote can't be updated." };
  await db.quote.update({ where: { id: quoteId }, data: parsed.data });
  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true, message: "Quote updated." };
}

const offerSchema = z
  .object({
    price: pence.refine((v) => v > 0, "Enter the project price"),
    hostingPlanKey: z.enum(HOSTING_PLANS.map((p) => p.key)),
    hostingBilling: z.enum(HOSTING_BILLING),
    hostingPrice: pence,
    message: optionalText(),
    projectTitle: z.string().trim().min(2, "Enter a project title").max(150),
    projectDescription: optionalText(),
    startDate: optionalDate,
    dueDate: optionalDate,
    defaultMilestones: z.string().optional().transform(Boolean),
  })
  .refine((v) => !v.startDate || !v.dueDate || v.dueDate >= v.startDate, { path: ["dueDate"], message: "Target launch must be on or after the start date" });

/**
 * Send (or edit and re-send) the confirmed quote to the client. They accept or decline it in
 * their portal; accepting creates the project (see `acceptOffer` in lib/quote-accept.ts).
 */
export async function sendQuoteOffer(quoteId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = offerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);

  const quote = await db.quote.findUnique({ where: { id: quoteId }, include: { user: true, project: { select: { id: true } } } });
  if (!quote || quote.project || !canSendOffer(quote.status)) return { error: "This quote can't be sent." };

  const offer = { ...parsed.data, hostingPrice: parsed.data.hostingPlanKey === "hosting_none" ? 0 : parsed.data.hostingPrice };
  await db.quote.update({
    where: { id: quoteId },
    data: { ...offer, status: "SENT", sentAt: new Date(), respondedAt: null, declineReason: null, changeRequest: null, invoiceOnAccept: null },
  });
  const emailed = await emails.quoteOfferSent(quote.user.email, quote.user.name, quote.id, offer.price, offerHosting(offer), offer.message);
  revalidatePath(`/admin/quotes/${quoteId}`);
  redirect(`/admin/quotes/${quoteId}?sent=1${emailed ? "" : "&email=failed"}`);
}

/** Take back a sent quote the client hasn't answered yet (e.g. to rethink it). */
export async function withdrawQuoteOffer(quoteId: string): Promise<ActionState> {
  await requireAdmin();
  const { count } = await db.quote.updateMany({ where: { id: quoteId, status: "SENT" }, data: { status: "REVIEWING" } });
  if (count !== 1) return { error: "The client has already replied to this quote." };
  revalidatePath(`/admin/quotes/${quoteId}`);
  redirect(`/admin/quotes/${quoteId}?withdrawn=1`);
}

/** Deletes a quote with everything linked to it: project, invoices (paid too), hosting plans (see deleteQuoteAndProject). */
export async function deleteQuote(quoteId: string): Promise<ActionState> {
  await requireAdmin();
  const quote = await db.quote.findUnique({ where: { id: quoteId }, select: { project: { select: { id: true } } } });
  if (!quote) redirect("/admin/quotes");
  const error = await deleteQuoteAndProject({ quoteId, projectId: quote.project?.id ?? null });
  if (error) return { error };
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/invoices");
  redirect("/admin/quotes?deleted=1");
}
