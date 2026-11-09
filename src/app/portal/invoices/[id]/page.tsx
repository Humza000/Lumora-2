import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/forms";
import { InvoiceView, invoiceViewInclude } from "@/components/invoice-view";
import { buttonClass } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { formatGBP } from "@/lib/money";
import { payInvoice } from "../actions";

export default async function PortalInvoice({ params, searchParams }: PageProps<"/portal/invoices/[id]">) {
  const user = await requireClient();
  const { id } = await params;
  const { paid } = await searchParams;
  const invoice = await db.invoice.findFirst({
    where: { id, clientId: user.id, status: { not: "DRAFT" } },
    include: invoiceViewInclude,
  });
  if (!invoice) notFound();

  const payable = invoice.status === "SENT" || invoice.status === "OVERDUE";

  return (
    <>
      <Link href="/portal/invoices" className="text-sm text-ink-muted hover:text-ink">
        ← All invoices
      </Link>
      {paid && invoice.status !== "PAID" && (
        <p className="mt-4 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          Thanks! Your payment is being confirmed. This page will show “Paid” shortly.
        </p>
      )}
      <div className="my-6 flex flex-wrap items-center justify-end gap-3">
        <a href={`/api/invoices/${invoice.id}/pdf`} className={buttonClass("secondary")}>
          Download PDF
        </a>
        {payable && (
          <ActionForm action={payInvoice.bind(null, invoice.id)} className="space-y-2">
            <SubmitButton pendingText="Redirecting to payment…">Pay {formatGBP(invoice.total)} now</SubmitButton>
          </ActionForm>
        )}
      </div>
      <InvoiceView invoice={invoice} />
    </>
  );
}
