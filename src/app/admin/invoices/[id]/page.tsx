import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/forms";
import { InvoiceView, invoiceViewInclude } from "@/components/invoice-view";
import { Button, Card, PageHeader, buttonClass } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { effectiveStatus } from "@/lib/invoice";
import { deleteDraftInvoice, sendInvoice, setInvoiceStatus, updateInvoice } from "../../_actions/invoices";
import { InvoiceForm } from "../invoice-form";
import { invoiceFormOptions } from "../options";

export default async function AdminInvoice({ params, searchParams }: PageProps<"/admin/invoices/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { edit, sent } = await searchParams;
  const invoice = await db.invoice.findUnique({ where: { id }, include: invoiceViewInclude });
  if (!invoice) notFound();

  const isDraft = invoice.status === "DRAFT";
  const status = effectiveStatus(invoice.status, invoice.dueDate);

  if (isDraft && edit) {
    const options = await invoiceFormOptions();
    return (
      <>
        <Link href={`/admin/invoices/${invoice.id}`} className="text-sm text-ink-muted hover:text-ink">
          ← Cancel editing
        </Link>
        <div className="mt-4">
          <PageHeader title="Edit draft invoice" />
        </div>
        <Card>
          <InvoiceForm action={updateInvoice.bind(null, invoice.id)} {...options} d={invoice} submitLabel="Save changes" />
        </Card>
      </>
    );
  }

  return (
    <>
      <Link href="/admin/invoices" className="text-sm text-ink-muted hover:text-ink">
        ← All invoices
      </Link>

      <div className="my-6 flex flex-wrap items-start justify-end gap-3">
        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" className={buttonClass("secondary")}>
          PDF
        </a>
        {isDraft && (
          <>
            <Link href={`/admin/invoices/${invoice.id}?edit=1`} className={buttonClass("secondary")}>
              Edit
            </Link>
            <form action={deleteDraftInvoice.bind(null, invoice.id)}>
              <Button variant="ghost" className="text-danger">
                Delete draft
              </Button>
            </form>
            <ActionForm action={sendInvoice.bind(null, invoice.id)} className="space-y-2">
              <SubmitButton pendingText="Sending…">Send to client</SubmitButton>
            </ActionForm>
          </>
        )}
        {(status === "SENT" || status === "OVERDUE") && (
          <>
            {invoice.status === "SENT" && status === "OVERDUE" && (
              <form action={setInvoiceStatus.bind(null, invoice.id, "OVERDUE")}>
                <Button variant="secondary">Mark overdue</Button>
              </form>
            )}
            <form action={setInvoiceStatus.bind(null, invoice.id, "VOID")}>
              <Button variant="ghost" className="text-danger">
                Void
              </Button>
            </form>
            <form action={setInvoiceStatus.bind(null, invoice.id, "PAID")}>
              <Button>Mark as paid</Button>
            </form>
          </>
        )}
        {invoice.status === "PAID" && (
          <form action={setInvoiceStatus.bind(null, invoice.id, "SENT")}>
            <Button variant="ghost">Mark unpaid</Button>
          </form>
        )}
      </div>

      {sent && invoice.status === "SENT" && (
        <p role="status" className="mb-4 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          Invoice {invoice.number} sent to {invoice.client.email}.
        </p>
      )}
      {isDraft && (
        <p className="mb-4 rounded-xl border border-brand-light/20 bg-brand-strong/10 px-4 py-3 text-sm text-brand-light">
          This is a draft. The client can&apos;t see it until you send it. Sending assigns the invoice number and emails
          the client a link to view and pay.
        </p>
      )}
      <InvoiceView invoice={invoice} />
    </>
  );
}
