import Link from "next/link";
import { Card, EmptyState, PageHeader, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { daysFromNow, daysUntil, monthlyValue } from "@/lib/hosting";
import { formatGBP } from "@/lib/money";
import { formatEstimate } from "@/lib/pricing";
import { projectProgress } from "@/lib/progress";

export default async function AdminOverview() {
  await requireAdmin();
  const in30 = daysFromNow(30);

  const [newQuotes, activeProjects, unpaid, renewals, activePlans] = await Promise.all([
    db.quote.findMany({
      where: { status: { in: ["SUBMITTED", "REVIEWING"] } },
      include: { user: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
    db.project.findMany({
      where: { status: { in: ["PLANNING", "IN_PROGRESS", "REVIEW"] } },
      include: { client: { select: { name: true } }, milestones: { select: { status: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.invoice.findMany({ where: { status: { in: ["SENT", "OVERDUE"] } }, select: { total: true, dueDate: true } }),
    db.hostingPlan.findMany({
      where: { status: "ACTIVE", renewalDate: { lte: in30 } },
      include: { client: { select: { name: true } } },
      orderBy: { renewalDate: "asc" },
    }),
    db.hostingPlan.findMany({ where: { status: "ACTIVE" }, select: { price: true, interval: true } }),
  ]);

  const outstanding = unpaid.reduce((s, i) => s + i.total, 0);
  const overdue = unpaid.filter((i) => i.dueDate < new Date()).length;
  const mrr = activePlans.reduce((s, p) => s + monthlyValue(p.price, p.interval), 0);

  const stats = [
    { label: "Quotes to review", value: String(newQuotes.length), href: "/admin/quotes" },
    { label: "Active projects", value: String(activeProjects.length), href: "/admin/projects" },
    { label: "Outstanding", value: formatGBP(outstanding), sub: overdue ? `${overdue} overdue` : undefined, href: "/admin/invoices" },
    { label: "Hosting MRR", value: formatGBP(mrr), sub: `${activePlans.length} active plans`, href: "/admin/hosting" },
  ];

  return (
    <>
      <PageHeader title="Overview" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card interactive className="h-full">
              <p className="text-sm text-ink-muted">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold">{s.value}</p>
              {s.sub && <p className="mt-1 text-xs text-danger">{s.sub}</p>}
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">New quote requests</h2>
          {newQuotes.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing waiting for review.</p>
          ) : (
            <ul className="divide-y divide-line">
              {newQuotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                  <Link href={`/admin/quotes/${q.id}`} className="font-medium text-brand-light hover:underline">
                    {q.user.name}
                  </Link>
                  <span className="text-ink-muted">
                    {formatEstimate(q.estimateMin, q.estimateMax)}
                  </span>
                  <StatusBadge status={q.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Renewals due in the next 30 days</h2>
          {renewals.length === 0 ? (
            <p className="text-sm text-ink-muted">No upcoming renewals.</p>
          ) : (
            <ul className="divide-y divide-line">
              {renewals.map((p) => {
                const days = daysUntil(p.renewalDate);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                    <Link href={`/admin/hosting/${p.id}`} className="font-medium text-brand-light hover:underline">
                      {p.domain}
                    </Link>
                    <span className="text-ink-muted">{p.client.name}</span>
                    <span className={days < 0 ? "text-danger" : days <= 7 ? "text-warning" : ""}>
                      {days < 0 ? `${-days}d overdue` : `${formatDate(p.renewalDate)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Active projects</h2>
      {activeProjects.length === 0 ? (
        <EmptyState title="No active projects" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((p) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`}>
              <Card interactive className="h-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-ink-muted">{p.client.name}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-4">
                  <ProgressBar value={projectProgress(p.milestones)} />
                </div>
                <p className="mt-2 text-xs text-ink-muted">Due {formatDate(p.dueDate)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
