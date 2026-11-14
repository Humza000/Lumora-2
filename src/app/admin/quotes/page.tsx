import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge, Table, Td, Th, cn, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PROJECT_TYPES, formatEstimate, quoteDraftSchema } from "@/lib/pricing";
import type { QuoteStatus } from "@/generated/prisma/client";

export const metadata = { title: "Quotes" };

const FILTERS: { key: string; label: string; statuses: QuoteStatus[] }[] = [
  { key: "open", label: "To review", statuses: ["SUBMITTED", "REVIEWING"] },
  { key: "accepted", label: "Accepted", statuses: ["ACCEPTED"] },
  { key: "declined", label: "Declined", statuses: ["DECLINED"] },
  { key: "drafts", label: "Unsubmitted drafts", statuses: ["DRAFT"] },
];

export default async function AdminQuotes({ searchParams }: PageProps<"/admin/quotes">) {
  await requireAdmin();
  const { filter = "open" } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const quotes = await db.quote.findMany({
    where: { status: { in: active.statuses } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ submittedAt: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <>
      <PageHeader title="Quotes" description="Requests submitted through the quote wizard." />
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/quotes?filter=${f.key}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              f.key === active.key ? "bg-brand text-on-brand font-medium shadow-[0_0_20px_-4px_var(--brand-strong)]" : "border border-line bg-surface text-ink-muted hover:border-brand-strong/50 hover:text-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {quotes.length === 0 ? (
        <EmptyState title="No quotes here" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Client</Th>
              <Th>Business</Th>
              <Th>Type</Th>
              <Th>Estimate</Th>
              <Th>Date</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const a = quoteDraftSchema.safeParse(q.answers);
              const answers = a.success ? a.data : {};
              return (
                <tr key={q.id}>
                  <Td>
                    <Link href={`/admin/quotes/${q.id}`} className="font-medium text-brand-light hover:underline">
                      {q.user.name}
                    </Link>
                    <p className="text-xs text-ink-muted">{q.user.email}</p>
                  </Td>
                  <Td>{answers.businessName || "—"}</Td>
                  <Td>{PROJECT_TYPES.find((t) => t.key === answers.projectType)?.label ?? "—"}</Td>
                  <Td>
                    {formatEstimate(q.estimateMin, q.estimateMax)}
                  </Td>
                  <Td>{formatDate(q.submittedAt ?? q.updatedAt)}</Td>
                  <Td>
                    <StatusBadge status={q.status} />
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
