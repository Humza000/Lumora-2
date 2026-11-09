import Link from "next/link";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, StatusBadge, Table, Td, Th, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { daysUntil, monthlyValue } from "@/lib/hosting";
import { formatGBP } from "@/lib/money";

export const metadata = { title: "Hosting & maintenance" };

export default async function AdminHosting() {
  await requireAdmin();
  const plans = await db.hostingPlan.findMany({
    include: { client: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { renewalDate: "asc" }],
  });

  const active = plans.filter((p) => p.status === "ACTIVE");
  const mrr = active.reduce((s, p) => s + monthlyValue(p.price, p.interval), 0);
  const dueSoon = active.filter((p) => daysUntil(p.renewalDate) <= 30).length;

  return (
    <>
      <PageHeader
        title="Hosting & maintenance"
        description="Client hosting and care plans, renewals and recurring revenue."
        actions={<ButtonLink href="/admin/hosting/new">Add plan</ButtonLink>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-ink-muted">Active plans</p>
          <p className="mt-1 text-2xl font-semibold">{active.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Monthly recurring revenue</p>
          <p className="mt-1 text-2xl font-semibold">{formatGBP(mrr)}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Renewing in 30 days</p>
          <p className="mt-1 text-2xl font-semibold">{dueSoon}</p>
        </Card>
      </div>
      {plans.length === 0 ? (
        <EmptyState title="No hosting plans yet" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Domain</Th>
              <Th>Client</Th>
              <Th>Plan</Th>
              <Th>Price</Th>
              <Th>Next renewal</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => {
              const days = daysUntil(p.renewalDate);
              return (
                <tr key={p.id}>
                  <Td>
                    <Link href={`/admin/hosting/${p.id}`} className="font-medium text-brand hover:underline">
                      {p.domain}
                    </Link>
                    <p className="text-xs text-ink-muted">{p.provider}</p>
                  </Td>
                  <Td>{p.client.name}</Td>
                  <Td>
                    {p.planName}
                    {p.includesMaintenance && <p className="text-xs text-ink-muted">incl. maintenance</p>}
                  </Td>
                  <Td>
                    {formatGBP(p.price)}/{p.interval === "MONTHLY" ? "mo" : "yr"}
                  </Td>
                  <Td>
                    {formatDate(p.renewalDate)}{" "}
                    {p.status === "ACTIVE" && days < 0 && <Badge tone="danger">Overdue</Badge>}
                    {p.status === "ACTIVE" && days >= 0 && days <= 14 && <Badge tone="warning">{days}d</Badge>}
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
