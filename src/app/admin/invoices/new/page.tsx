import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/dal";
import { createInvoice } from "../../_actions/invoices";
import { InvoiceForm } from "../invoice-form";
import { invoiceFormOptions } from "../options";

export const metadata = { title: "New invoice" };

export default async function NewInvoice({ searchParams }: PageProps<"/admin/invoices/new">) {
  await requireAdmin();
  const { client, project, quote } = await searchParams;
  const options = await invoiceFormOptions();

  return (
    <>
      <PageHeader
        title="New invoice"
        description="Save it as a draft to check first, or send it straight away. The client is emailed when it’s sent."
      />
      <Card>
        <InvoiceForm
          action={createInvoice}
          {...options}
          d={{
            clientId: typeof client === "string" ? client : undefined,
            projectId: typeof project === "string" ? project : undefined,
            quoteId: typeof quote === "string" ? quote : undefined,
          }}
          submitLabel="Save draft"
          allowSend
        />
      </Card>
    </>
  );
}
