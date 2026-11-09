import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { effectiveStatus } from "@/lib/invoice";
import { formatGBP } from "@/lib/money";
import { projectProgress } from "@/lib/progress";

export default async function PortalHome() {
  const user = await requireClient();
  const [projects, invoices, quotes] = await Promise.all([
    db.project.findMany({
      where: { clientId: user.id },
      include: { milestones: { select: { status: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.invoice.findMany({
      where: { clientId: user.id, status: { in: ["SENT", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
    }),
    db.quote.findMany({
      where: { userId: user.id, status: { in: ["SUBMITTED", "REVIEWING"] } },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const firstName = user.name.split(" ")[0];
  const active = projects.filter((p) => p.status !== "COMPLETED");

  return (
    <>
      <PageHeader title={`Welcome back, ${firstName}`} description="Here's where everything stands." />

      {invoices.length > 0 && (
        <Card className="mb-6 border-warning/40 bg-warning/5">
          <p className="font-medium">
            You have {invoices.length} outstanding invoice{invoices.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Link href={`/portal/invoices/${inv.id}`} className="text-brand hover:underline">
                  {inv.number}
                </Link>{" "}
                · {formatGBP(inv.total)} · due {formatDate(inv.dueDate)}{" "}
                {effectiveStatus(inv.status, inv.dueDate) === "OVERDUE" && <StatusBadge status="OVERDUE" />}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2 className="mb-4 text-lg font-semibold">Your projects</h2>
      {active.length === 0 ? (
        <EmptyState
          title={quotes.length ? "We're reviewing your quote" : "No active projects"}
          description={
            quotes.length
              ? "We'll be in touch shortly. Once your project starts, you'll be able to follow every milestone here."
              : "Ready to start something new?"
          }
          action={!quotes.length && <ButtonLink href="/quote">Get a quote</ButtonLink>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((p) => (
            <Link key={p.id} href={`/portal/projects/${p.id}`} className="block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.title}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-5">
                  <ProgressBar value={projectProgress(p.milestones)} label="Progress" />
                </div>
                {p.dueDate && <p className="mt-3 text-xs text-ink-muted">Target launch {formatDate(p.dueDate)}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {quotes.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 text-lg font-semibold">Quotes in review</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {quotes.map((q) => (
              <Card key={q.id}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-muted">Submitted {formatDate(q.submittedAt)}</p>
                  <StatusBadge status={q.status} />
                </div>
                <p className="mt-2 font-medium">
                  {formatGBP(q.estimateMin, { whole: true })} – {formatGBP(q.estimateMax, { whole: true })}
                </p>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
