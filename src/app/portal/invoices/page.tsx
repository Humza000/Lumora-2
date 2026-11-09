import Link from "next/link";
import { EmptyState, PageHeader, StatusBadge, Table, Td, Th, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { effectiveStatus } from "@/lib/invoice";
import { formatGBP } from "@/lib/money";

export const metadata = { title: "Invoices" };

export default async function PortalInvoices() {
  const user = await requireClient();
  // Drafts are internal: clients only see invoices once sent.
  const invoices = await db.invoice.findMany({
    where: { clientId: user.id, status: { not: "DRAFT" } },
    orderBy: { issueDate: "desc" },
  });

  return (
    <>
      <PageHeader title="Invoices" />
      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Invoice</Th>
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
                  <Link href={`/portal/invoices/${inv.id}`} className="font-medium text-brand-light hover:underline">
                    {inv.number}
                  </Link>
                </Td>
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
