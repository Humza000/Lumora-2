import { invoiceViewInclude } from "@/components/invoice-view";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/dal";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

export async function GET(_req: Request, ctx: RouteContext<"/api/invoices/[id]/pdf">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const invoice = await db.invoice.findFirst({
    // Admins can download any invoice; clients only their own non-draft invoices.
    where: user.role === "ADMIN" ? { id } : { id, clientId: user.id, status: { not: "DRAFT" } },
    include: invoiceViewInclude,
  });
  if (!invoice) return new Response("Not found", { status: 404 });

  const pdf = await renderInvoicePdf(invoice);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number ?? "draft-invoice"}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
