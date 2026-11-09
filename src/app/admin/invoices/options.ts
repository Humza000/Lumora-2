import "server-only";
import { db } from "@/lib/db";

/** Select options for the invoice form. */
export async function invoiceFormOptions() {
  const [clients, projects, plans] = await Promise.all([
    db.user.findMany({ where: { role: "CLIENT" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.project.findMany({ select: { id: true, title: true, clientId: true }, orderBy: { createdAt: "desc" } }),
    db.hostingPlan.findMany({ select: { id: true, domain: true, clientId: true }, orderBy: { domain: "asc" } }),
  ]);
  return {
    clients,
    projects: projects.map((p) => ({ id: p.id, label: p.title, clientId: p.clientId })),
    plans: plans.map((p) => ({ id: p.id, label: p.domain, clientId: p.clientId })),
  };
}
