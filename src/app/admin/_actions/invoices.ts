"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { emails } from "@/lib/email";
import { calculateTotals } from "@/lib/invoice";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { startProjectIfPaid } from "@/lib/project-payment";
import { expireCheckoutSessions } from "@/lib/stripe-cleanup";
import { fieldError, fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { optionalText, pence, requiredDate } from "@/lib/validation";

const lineSchema = z.object({
  description: z.string().trim().min(1, "Each line needs a description").max(300),
  quantity: z.coerce.number().int().min(1).max(10000),
  unitPrice: pence,
});

const invoiceSchema = z
  .object({
    clientId: z.string().min(1, "Choose a client"),
    projectId: z.string().optional().transform((v) => v || null),
    hostingPlanId: z.string().optional().transform((v) => v || null),
    quoteId: z.string().optional().transform((v) => v || null),
    issueDate: requiredDate,
    dueDate: requiredDate,
    vatRate: z.coerce.number().int().min(0).max(100),
    notes: optionalText(),
    lines: z
      .string()
      .transform((s, ctx) => {
        try {
          return JSON.parse(s) as unknown;
        } catch {
          ctx.addIssue({ code: "custom", message: "Invalid line items" });
          return z.NEVER;
        }
      })
      .pipe(z.array(lineSchema).min(1, "Add at least one line item")),
  })
  .refine((v) => v.dueDate >= v.issueDate, { path: ["dueDate"], message: "Due date must be on or after the issue date" });

async function parseInvoice(fd: FormData) {
  const parsed = invoiceSchema.safeParse(formToObject(fd)); // unknown fields (e.g. `intent`) are ignored
  if (!parsed.success) return { error: fromZodError(parsed.error) } as const;
  const data = parsed.data;

  // Make sure linked records belong to the chosen client.
  const client = await db.user.findFirst({ where: { id: data.clientId, role: "CLIENT" } });
  if (!client) return { error: fieldError("clientId", "Client not found") } as const;
  if (data.projectId && !(await db.project.findFirst({ where: { id: data.projectId, clientId: data.clientId } }))) {
    return { error: fieldError("projectId", "That project belongs to a different client") } as const;
  }
  if (data.hostingPlanId && !(await db.hostingPlan.findFirst({ where: { id: data.hostingPlanId, clientId: data.clientId } }))) {
    return { error: fieldError("hostingPlanId", "That plan belongs to a different client") } as const;
  }
  if (data.quoteId && !(await db.quote.findFirst({ where: { id: data.quoteId, userId: data.clientId } }))) {
    return { error: fieldError("quoteId", "That quote belongs to a different client") } as const;
  }
  return { data, totals: calculateTotals(data.lines, data.vatRate) } as const;
}

export async function createInvoice(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const res = await parseInvoice(fd);
  if ("error" in res) return res.error;
  const { lines, ...data } = res.data;

  const invoice = await db.invoice.create({
    data: { ...data, ...res.totals, status: "DRAFT", lines: { create: lines } },
  });
  // "Create & send to client": issue it straight away instead of leaving a draft.
  if (fd.get("intent") === "send") redirect(await issueAndEmail(invoice.id));
  redirect(`/admin/invoices/${invoice.id}`);
}

/**
 * Allocates the sequential invoice number, marks the draft SENT and emails the client a link to
 * view and pay it. Returns the admin URL to show next, flagging if the email couldn't be sent.
 */
async function issueAndEmail(invoiceId: string) {
  const existing = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { client: true } });
  const invoice = await db.$transaction(async (tx) => {
    const number = existing.number ?? (await nextInvoiceNumber(tx, existing.issueDate));
    return tx.invoice.update({ where: { id: invoiceId, status: "DRAFT" }, data: { number, status: "SENT" } });
  });
  const emailed = await emails.invoiceSent(existing.client.email, existing.client.name, invoice.id, invoice.number!, invoice.total, invoice.dueDate);
  return `/admin/invoices/${invoiceId}?sent=1${emailed ? "" : "&email=failed"}`;
}

export async function updateInvoice(invoiceId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const existing = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!existing || existing.status !== "DRAFT") return { error: "Only draft invoices can be edited." };
  const res = await parseInvoice(fd);
  if ("error" in res) return res.error;
  const { lines, ...data } = res.data;

  await db.$transaction([
    db.invoiceLine.deleteMany({ where: { invoiceId } }),
    db.invoice.update({ where: { id: invoiceId }, data: { ...data, ...res.totals, lines: { create: lines } } }),
  ]);
  revalidatePath(`/admin/invoices/${invoiceId}`);
  redirect(`/admin/invoices/${invoiceId}`);
}

/** Allocates the sequential invoice number, marks as SENT and emails the client. */
export async function sendInvoice(invoiceId: string): Promise<ActionState> {
  await requireAdmin();
  const existing = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!existing || existing.status !== "DRAFT") return { error: "Only draft invoices can be sent." };
  // The send form disappears once the invoice isn't a draft, so confirm via the URL.
  redirect(await issueAndEmail(invoiceId));
}

export async function setInvoiceStatus(invoiceId: string, status: "PAID" | "VOID" | "OVERDUE" | "SENT") {
  await requireAdmin();
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.status === "DRAFT") return;
  await db.invoice.update({
    where: { id: invoiceId },
    data: { status, paidAt: status === "PAID" ? (invoice.paidAt ?? new Date()) : null },
  });
  if (status === "PAID") await startProjectIfPaid(invoice.projectId);
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath("/admin/invoices");
}

/** Deletes an invoice, paid or not (it disappears from the client portal). A paid one is not refunded. */
export async function deleteInvoice(invoiceId: string): Promise<ActionState> {
  await requireAdmin();
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId }, select: { stripeSessionId: true } });
  if (invoice) {
    await expireCheckoutSessions([invoice.stripeSessionId]);
    await db.invoice.deleteMany({ where: { id: invoiceId } });
  }
  revalidatePath("/admin/invoices");
  redirect("/admin/invoices?deleted=1");
}
