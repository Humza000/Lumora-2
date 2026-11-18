"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { deleteQuoteAndProject } from "@/lib/delete-records";
import { emails } from "@/lib/email";
import { calculateTotals } from "@/lib/invoice";
import { nextInvoiceNumber } from "@/lib/invoice-number";
import { formatGBP } from "@/lib/money";
import { summariseQuote } from "@/lib/pricing";
import { DEFAULT_MILESTONES } from "@/lib/progress";
import { balanceInvoiceLines, hostingFromQuote, websiteBalance } from "@/lib/quote-offer";
import { fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { optionalDate, optionalText } from "@/lib/validation";

const projectSchema = z.object({
  title: z.string().trim().min(2, "Enter a title").max(150),
  description: optionalText(),
  clientId: z.string().min(1, "Choose a client"),
  status: z.enum(["AWAITING_PAYMENT", "PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "ON_HOLD"]),
  startDate: optionalDate,
  dueDate: optionalDate,
});

const refresh = (projectId: string) => {
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);
};

export async function createProject(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const client = await db.user.findFirst({ where: { id: parsed.data.clientId, role: "CLIENT" } });
  if (!client) return { fieldErrors: { clientId: ["Client not found"] } };

  const project = await db.project.create({
    data: {
      ...parsed.data,
      milestones: fd.get("defaultMilestones")
        ? { create: DEFAULT_MILESTONES.map((m, i) => ({ ...m, order: i })) }
        : undefined,
    },
  });
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProject(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  await db.project.update({ where: { id: projectId }, data: parsed.data });
  refresh(projectId);
  return { ok: true, message: "Project saved." };
}

const milestoneSchema = z.object({
  title: z.string().trim().min(2, "Enter a title").max(150),
  description: optionalText(1000),
  dueDate: optionalDate,
});

export async function addMilestone(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = milestoneSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const last = await db.milestone.findFirst({ where: { projectId }, orderBy: { order: "desc" } });
  await db.milestone.create({ data: { ...parsed.data, projectId, order: (last?.order ?? -1) + 1 } });
  refresh(projectId);
  return { ok: true };
}

export async function setMilestoneStatus(milestoneId: string, fd: FormData) {
  await requireAdmin();
  const status = z.enum(["PENDING", "IN_PROGRESS", "DONE"]).parse(fd.get("status"));
  const m = await db.milestone.update({
    where: { id: milestoneId },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });
  refresh(m.projectId);
}

export async function moveMilestone(milestoneId: string, direction: "up" | "down") {
  await requireAdmin();
  const m = await db.milestone.findUniqueOrThrow({ where: { id: milestoneId } });
  const neighbour = await db.milestone.findFirst({
    where: { projectId: m.projectId, order: direction === "up" ? { lt: m.order } : { gt: m.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;
  await db.$transaction([
    db.milestone.update({ where: { id: m.id }, data: { order: neighbour.order } }),
    db.milestone.update({ where: { id: neighbour.id }, data: { order: m.order } }),
  ]);
  refresh(m.projectId);
}

export async function deleteMilestone(milestoneId: string) {
  await requireAdmin();
  const m = await db.milestone.delete({ where: { id: milestoneId } });
  refresh(m.projectId);
}

export async function postUpdate(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const body = z.string().trim().min(2, "Write an update").max(4000).safeParse(fd.get("body"));
  if (!body.success) return { fieldErrors: { body: [body.error.issues[0].message] } };
  await db.projectUpdate.create({ data: { projectId, body: body.data } });
  refresh(projectId);
  return { ok: true, message: "Update posted. The client can see it in their portal." };
}

export async function deleteUpdate(updateId: string) {
  await requireAdmin();
  const u = await db.projectUpdate.delete({ where: { id: updateId } });
  refresh(u.projectId);
}

const launchSchema = z.object({
  domain: z.string().trim().max(253).optional().default(""),
  provider: z.string().trim().max(100).optional().default(""),
});

/**
 * The site is live: marks the project completed, tells the client, and (if their accepted quote
 * includes paid hosting) creates the hosting plan and asks them to start it by card.
 */
export async function launchProject(projectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = launchSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { client: { select: { name: true, email: true } }, quote: true, hostingPlans: { select: { id: true } } },
  });
  if (!project || project.status === "COMPLETED") return { error: "This project has already been launched." };

  // A quote accepted with a deposit has its balance due before launch.
  if (project.quote?.invoiceOnAccept) {
    const balance = websiteBalance(project.quote.price, await quoteInvoices(project.quote.id));
    if (balance.toInvoice > 0) {
      return { error: `The website balance of ${formatGBP(balance.toInvoice)} hasn't been invoiced yet. Send the balance invoice first.` };
    }
    if (balance.unpaid > 0) {
      return { error: `${formatGBP(balance.unpaid)} of the website price is still unpaid. Launch once it's paid (or mark the invoice as paid).` };
    }
  }

  const hosting = project.quote && project.hostingPlans.length === 0 ? hostingFromQuote(project.quote) : null;
  if (hosting && parsed.data.domain.length < 3) return { fieldErrors: { domain: ["Enter the live domain, e.g. example.co.uk"] } };

  await db.$transaction([
    db.project.update({ where: { id: projectId }, data: { status: "COMPLETED" } }),
    db.milestone.updateMany({ where: { projectId, status: { not: "DONE" } }, data: { status: "DONE", completedAt: new Date() } }),
    db.projectUpdate.create({
      data: {
        projectId,
        body: hosting
          ? `Your website is live! The last step is to start your ${hosting.planName} plan from the Hosting page.`
          : "Your website is live! Thank you for working with us.",
      },
    }),
    ...(hosting
      ? [
          db.hostingPlan.create({
            data: { ...hosting, clientId: project.clientId, projectId, domain: parsed.data.domain, provider: parsed.data.provider || "Vercel", renewalDate: new Date() },
          }),
        ]
      : []),
  ]);
  const emailed = hosting ? await emails.hostingStarted(project.client.email, project.client.name, hosting.planName, parsed.data.domain) : true;
  refresh(projectId);
  redirect(`/admin/projects/${projectId}?launched=${hosting ? "hosting" : "1"}${emailed ? "" : "&email=failed"}`);
}

/** The invoices that bill a quote (website and hosting), for `websiteBalance`. */
function quoteInvoices(quoteId: string) {
  return db.invoice.findMany({ where: { quoteId }, select: { subtotal: true, status: true, hostingPlanId: true } });
}

/**
 * After a 50% deposit: issues (numbers, sends and emails) the invoice for the rest of the website
 * price. Does nothing if the balance has already been invoiced.
 */
export async function sendBalanceInvoice(projectId: string): Promise<ActionState> {
  await requireAdmin();
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { client: { select: { name: true, email: true } }, quote: { select: { id: true, price: true, answers: true } } },
  });
  if (!project?.quote) return { error: "This project has no accepted quote to bill." };
  const quote = project.quote;
  const { toInvoice } = websiteBalance(quote.price, await quoteInvoices(quote.id));
  const lines = balanceInvoiceLines(toInvoice, summariseQuote(quote.answers).packageName);
  if (lines.length === 0) return { error: "The website price has already been invoiced in full." };

  const now = new Date();
  const invoice = await db.$transaction(async (tx) =>
    tx.invoice.create({
      data: {
        clientId: project.clientId,
        projectId: project.id,
        quoteId: quote.id,
        number: await nextInvoiceNumber(tx, now),
        status: "SENT",
        issueDate: now,
        dueDate: new Date(now.getTime() + 14 * 86400_000),
        vatRate: 0,
        ...calculateTotals(lines, 0),
        lines: { create: lines },
      },
    }),
  );
  const emailed = await emails.invoiceSent(project.client.email, project.client.name, invoice.id, invoice.number!, invoice.total, invoice.dueDate);
  refresh(projectId);
  redirect(`/admin/projects/${projectId}?balance=sent${emailed ? "" : "&email=failed"}`);
}

/** Deletes a project with everything linked to it: the quote it came from, invoices (paid too), hosting plans. */
export async function deleteProject(projectId: string): Promise<ActionState> {
  await requireAdmin();
  const project = await db.project.findUnique({ where: { id: projectId }, select: { quoteId: true } });
  if (!project) redirect("/admin/projects");
  const error = await deleteQuoteAndProject({ quoteId: project.quoteId, projectId });
  if (error) return { error };
  revalidatePath("/admin/projects");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/invoices");
  redirect("/admin/projects?deleted=1");
}
