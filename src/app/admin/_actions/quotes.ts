"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { DEFAULT_MILESTONES } from "@/lib/progress";
import { fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { optionalDate, optionalText } from "@/lib/validation";

const reviewSchema = z.object({
  status: z.enum(["SUBMITTED", "REVIEWING", "DECLINED"]),
  adminNotes: optionalText(),
});

export async function updateQuoteReview(quoteId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = reviewSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const quote = await db.quote.findUnique({ where: { id: quoteId } });
  if (!quote || quote.status === "DRAFT" || quote.status === "ACCEPTED") return { error: "This quote can't be updated." };
  await db.quote.update({ where: { id: quoteId }, data: parsed.data });
  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true, message: "Quote updated." };
}

const acceptSchema = z.object({
  title: z.string().trim().min(2, "Enter a project title").max(150),
  description: optionalText(),
  startDate: optionalDate,
  dueDate: optionalDate,
  defaultMilestones: z.string().optional(),
});

/** Accept a quote and convert it into a project (with the default milestone plan). */
export async function acceptQuote(quoteId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = acceptSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);

  const quote = await db.quote.findUnique({ where: { id: quoteId }, include: { project: true } });
  if (!quote || quote.project || quote.status === "DRAFT" || quote.status === "ACCEPTED") {
    return { error: "This quote has already been converted or can't be accepted." };
  }

  const { defaultMilestones, ...data } = parsed.data;
  const project = await db.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } });
    return tx.project.create({
      data: {
        ...data,
        clientId: quote.userId,
        quoteId,
        status: "PLANNING",
        startDate: data.startDate ?? new Date(),
        milestones: defaultMilestones
          ? { create: DEFAULT_MILESTONES.map((m, i) => ({ ...m, order: i })) }
          : undefined,
        updates: { create: { body: "Your quote has been accepted and your project has been set up. Welcome aboard!" } },
      },
    });
  });

  redirect(`/admin/projects/${project.id}`);
}
