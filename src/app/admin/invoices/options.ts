import "server-only";
import { db } from "@/lib/db";
import { getPriceMap } from "@/lib/prices";
import { summariseQuote } from "@/lib/pricing";

/** Select options for the invoice form. */
export async function invoiceFormOptions() {
  const [clients, projects, plans, quotes, prices] = await Promise.all([
    db.user.findMany({ where: { role: "CLIENT" }, select: { id: true, name: true, email: true }, orderBy: { email: "asc" } }),
    db.project.findMany({ select: { id: true, title: true, clientId: true }, orderBy: { createdAt: "desc" } }),
    db.hostingPlan.findMany({ select: { id: true, domain: true, clientId: true }, orderBy: { domain: "asc" } }),
    // Quotes the client actually sent us (drafts are unfinished).
    db.quote.findMany({
      where: { status: { in: ["SUBMITTED", "REVIEWING", "ACCEPTED"] } },
      select: { id: true, userId: true, answers: true, estimateMin: true, estimateMax: true, submittedAt: true },
      orderBy: { submittedAt: "desc" },
    }),
    getPriceMap(),
  ]);
  return {
    clients,
    projects: projects.map((p) => ({ id: p.id, label: p.title, clientId: p.clientId })),
    plans: plans.map((p) => ({ id: p.id, label: p.domain, clientId: p.clientId })),
    quotes: quotes.map((q) => {
      const summary = summariseQuote(q.answers, prices, { min: q.estimateMin, max: q.estimateMax });
      const date = q.submittedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      return {
        id: q.id,
        clientId: q.userId,
        label: [summary.packageName ?? "Quote", summary.hosting, date && `sent ${date}`].filter(Boolean).join(" · "),
        summary,
      };
    }),
  };
}

export type InvoiceFormOptions = Awaited<ReturnType<typeof invoiceFormOptions>>;
