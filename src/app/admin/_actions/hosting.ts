"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { advanceRenewal } from "@/lib/hosting";
import { fieldError, fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { optionalText, pence, requiredDate } from "@/lib/validation";

const planSchema = z.object({
  clientId: z.string().min(1, "Choose a client"),
  projectId: z.string().optional().transform((v) => v || null),
  domain: z.string().trim().min(3, "Enter the domain").max(253),
  provider: z.string().trim().min(1, "Enter the hosting provider").max(100),
  planName: z.string().trim().min(1, "Enter a plan name").max(100),
  includesMaintenance: z.string().optional().transform((v) => v === "on"),
  price: pence,
  interval: z.enum(["MONTHLY", "ANNUAL"]),
  renewalDate: requiredDate,
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]),
  notes: optionalText(),
});

async function parsePlan(fd: FormData) {
  const parsed = planSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: fromZodError(parsed.error) } as const;
  const client = await db.user.findFirst({ where: { id: parsed.data.clientId, role: "CLIENT" } });
  if (!client) return { error: fieldError("clientId", "Client not found") } as const;
  if (parsed.data.projectId && !(await db.project.findFirst({ where: { id: parsed.data.projectId, clientId: client.id } }))) {
    return { error: fieldError("projectId", "That project belongs to a different client") } as const;
  }
  return { data: parsed.data } as const;
}

export async function createHostingPlan(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const res = await parsePlan(fd);
  if ("error" in res) return res.error;
  const plan = await db.hostingPlan.create({ data: res.data });
  redirect(`/admin/hosting/${plan.id}`);
}

export async function updateHostingPlan(planId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const res = await parsePlan(fd);
  if ("error" in res) return res.error;
  await db.hostingPlan.update({ where: { id: planId }, data: res.data });
  revalidatePath(`/admin/hosting/${planId}`);
  return { ok: true, message: "Plan saved." };
}

/**
 * Raise a draft invoice for the next billing period and roll the renewal date forward.
 * The invoice stays a draft so it can be reviewed before sending.
 */
export async function invoiceNextPeriod(planId: string) {
  await requireAdmin();
  const plan = await db.hostingPlan.findUniqueOrThrow({ where: { id: planId } });
  const periodEnd = advanceRenewal(plan.renewalDate, plan.interval);
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const invoice = await db.$transaction(async (tx) => {
    await tx.hostingPlan.update({ where: { id: plan.id }, data: { renewalDate: periodEnd } });
    return tx.invoice.create({
      data: {
        clientId: plan.clientId,
        projectId: plan.projectId,
        hostingPlanId: plan.id,
        status: "DRAFT",
        issueDate: new Date(),
        dueDate: plan.renewalDate > new Date() ? plan.renewalDate : new Date(Date.now() + 14 * 86400_000),
        vatRate: 0,
        subtotal: plan.price,
        vat: 0,
        total: plan.price,
        lines: {
          create: {
            description: `${plan.planName}: ${plan.domain} (${fmt(plan.renewalDate)} – ${fmt(periodEnd)})`,
            quantity: 1,
            unitPrice: plan.price,
          },
        },
      },
    });
  });
  redirect(`/admin/invoices/${invoice.id}`);
}
