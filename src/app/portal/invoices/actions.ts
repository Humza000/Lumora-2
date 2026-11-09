"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { appUrl, site } from "@/lib/site";
import type { ActionState } from "@/lib/action-state";

export async function payInvoice(invoiceId: string): Promise<ActionState> {
  const user = await requireClient();
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, clientId: user.id, status: { in: ["SENT", "OVERDUE"] } },
  });
  if (!invoice) return { error: "This invoice can't be paid online." };
  if (!stripeEnabled()) return { error: "Online payments aren't available yet. Please contact us to pay." };

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    client_reference_id: user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: invoice.total,
          product_data: { name: `${site.name} invoice ${invoice.number}` },
        },
      },
    ],
    metadata: { invoiceId: invoice.id },
    payment_intent_data: { metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number } },
    success_url: appUrl(`/portal/invoices/${invoice.id}?paid=1`),
    cancel_url: appUrl(`/portal/invoices/${invoice.id}`),
  });

  await db.invoice.update({ where: { id: invoice.id }, data: { stripeSessionId: session.id } });
  if (!session.url) return { error: "Couldn't start the payment. Please try again." };
  redirect(session.url);
}
