import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/dal";
import { createInvoice } from "../../_actions/invoices";
import { InvoiceForm } from "../invoice-form";
import { invoiceFormOptions } from "../options";

export const metadata = { title: "New invoice" };

export default async function NewInvoice({ searchParams }: PageProps<"/admin/invoices/new">) {
  await requireAdmin();
  const { client, project } = await searchParams;
  const options = await invoiceFormOptions();

  return (
    <>
      <PageHeader
        title="New invoice"
        description="Saved as a draft. The invoice number is assigned when you send it."
      />
      <Card>
        <InvoiceForm
          action={createInvoice}
          {...options}
          d={{
            clientId: typeof client === "string" ? client : undefined,
            projectId: typeof project === "string" ? project : undefined,
          }}
          submitLabel="Save draft"
        />
      </Card>
    </>
  );
}
