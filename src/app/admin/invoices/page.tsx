import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader, StatusBadge, Table, Td, Th, cn, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { effectiveStatus } from "@/lib/invoice";
import { formatGBP } from "@/lib/money";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Invoices" };

const FILTERS: { key: string; label: string; where: Prisma.InvoiceWhereInput }[] = [
  { key: "all", label: "All", where: {} },
  { key: "draft", label: "Drafts", where: { status: "DRAFT" } },
  { key: "unpaid", label: "Unpaid", where: { status: { in: ["SENT", "OVERDUE"] } } },
  { key: "overdue", label: "Overdue", where: { OR: [{ status: "OVERDUE" }, { status: "SENT", dueDate: { lt: new Date() } }] } },
  { key: "paid", label: "Paid", where: { status: "PAID" } },
  { key: "void", label: "Void", where: { status: "VOID" } },
];

export default async function AdminInvoices({ searchParams }: PageProps<"/admin/invoices">) {
  await requireAdmin();
  const { filter = "all" } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const [invoices, unpaidAgg, paidAgg] = await Promise.all([
    db.invoice.findMany({
      where: active.where,
      include: { client: { select: { name: true } }, project: { select: { title: true } } },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
    }),
    db.invoice.aggregate({ where: { status: { in: ["SENT", "OVERDUE"] } }, _sum: { total: true } }),
    db.invoice.aggregate({ where: { status: "PAID", paidAt: { gte: yearStart } }, _sum: { total: true } }),
  ]);

  return (
    <>
      <PageHeader title="Invoices" actions={<ButtonLink href="/admin/invoices/new">New invoice</ButtonLink>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-ink-muted">Outstanding</p>
          <p className="mt-1 text-2xl font-semibold">{formatGBP(unpaidAgg._sum.total ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Paid this year</p>
          <p className="mt-1 text-2xl font-semibold">{formatGBP(paidAgg._sum.total ?? 0)}</p>
        </Card>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/invoices?filter=${f.key}`}
            className={cn("rounded-full px-3 py-1.5 text-sm", f.key === active.key ? "bg-ink text-white" : "bg-surface text-ink-muted hover:text-ink")}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {invoices.length === 0 ? (
        <EmptyState title="No invoices" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Number</Th>
              <Th>Client</Th>
              <Th>Project</Th>
              <Th>Issued</Th>
              <Th>Due</Th>
              <Th className="text-right">Total</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <Td>
                  <Link href={`/admin/invoices/${inv.id}`} className="font-mono font-medium text-brand hover:underline">
                    {inv.number ?? "Draft"}
                  </Link>
                </Td>
                <Td>{inv.client.name}</Td>
                <Td>{inv.project?.title ?? "—"}</Td>
                <Td>{formatDate(inv.issueDate)}</Td>
                <Td>{formatDate(inv.dueDate)}</Td>
                <Td className="text-right">{formatGBP(inv.total)}</Td>
                <Td>
                  <StatusBadge status={effectiveStatus(inv.status, inv.dueDate)} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
