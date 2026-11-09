import { formatDate, StatusBadge } from "./ui";
import { formatGBP } from "@/lib/money";
import { effectiveStatus } from "@/lib/invoice";
import { site } from "@/lib/site";

export type InvoiceForView = {
  number: string | null;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID";
  issueDate: Date;
  dueDate: Date;
  paidAt: Date | null;
  vatRate: number;
  subtotal: number;
  vat: number;
  total: number;
  notes: string | null;
  lines: { id: string; description: string; quantity: number; unitPrice: number }[];
  client: { name: string; email: string; profile: { company: string | null; address: string | null } | null };
  project: { title: string } | null;
};

export function InvoiceView({ invoice }: { invoice: InvoiceForView }) {
  return (
    <div className="ring-gradient relative isolate overflow-hidden rounded-2xl border border-line/60 bg-surface/90 p-6 md:p-10">
      <div className="pointer-events-none absolute -top-24 -right-24 -z-10 h-64 w-64 rounded-full bg-brand/25 blur-[90px]" aria-hidden />
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="font-display text-4xl font-semibold">Invoice</p>
          <p className="mt-1 font-mono text-sm text-ink-muted">{invoice.number ?? "Draft"}</p>
        </div>
        <StatusBadge status={effectiveStatus(invoice.status, invoice.dueDate)} />
      </div>

      <div className="mt-8 grid gap-6 text-sm sm:grid-cols-3">
        <div>
          <p className="text-ink-muted">From</p>
          <p className="mt-1 font-medium">{site.name}</p>
          <p className="text-ink-muted">{site.email}</p>
        </div>
        <div>
          <p className="text-ink-muted">Billed to</p>
          <p className="mt-1 font-medium">{invoice.client.profile?.company || invoice.client.name}</p>
          <p className="text-ink-muted">{invoice.client.email}</p>
          {invoice.client.profile?.address && <p className="whitespace-pre-line text-ink-muted">{invoice.client.profile.address}</p>}
        </div>
        <div className="space-y-1">
          <p>
            <span className="text-ink-muted">Issued:</span> {formatDate(invoice.issueDate)}
          </p>
          <p>
            <span className="text-ink-muted">Due:</span> {formatDate(invoice.dueDate)}
          </p>
          {invoice.paidAt && (
            <p>
              <span className="text-ink-muted">Paid:</span> {formatDate(invoice.paidAt)}
            </p>
          )}
          {invoice.project && (
            <p>
              <span className="text-ink-muted">Project:</span> {invoice.project.title}
            </p>
          )}
        </div>
      </div>

      <table className="mt-10 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink-muted">
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Unit price</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((l) => (
            <tr key={l.id} className="border-b border-line/60 transition-colors hover:bg-ink/[0.015]">
              <td className="py-3">{l.description}</td>
              <td className="py-3 text-right">{l.quantity}</td>
              <td className="py-3 text-right">{formatGBP(l.unitPrice)}</td>
              <td className="py-3 text-right">{formatGBP(l.quantity * l.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-muted">Subtotal</span>
          <span>{formatGBP(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-muted">VAT ({invoice.vatRate}%)</span>
          <span>{formatGBP(invoice.vat)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold text-brand-light">
          <span>Total</span>
          <span>{formatGBP(invoice.total)}</span>
        </div>
      </div>

      {invoice.notes && <p className="mt-10 border-t border-line pt-6 text-sm whitespace-pre-line text-ink-muted">{invoice.notes}</p>}
    </div>
  );
}

export const invoiceViewInclude = {
  lines: true,
  project: { select: { title: true } },
  client: { select: { name: true, email: true, profile: { select: { company: true, address: true } } } },
} as const;
