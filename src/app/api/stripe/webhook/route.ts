import type Stripe from "stripe";
import { db } from "@/lib/db";
import { emails } from "@/lib/email";
import { onSubscriptionCheckout, recordSubscriptionPayment, subscriptionPaymentFailed, syncSubscription } from "@/lib/hosting-billing";
import { startProjectIfPaid } from "@/lib/project-payment";
import { getStripe } from "@/lib/stripe";

// Stripe → POST /api/stripe/webhook. In the Stripe dashboard, send these events to this URL:
//   checkout.session.completed, checkout.session.async_payment_succeeded   (invoice payments, card setup)
//   customer.subscription.updated, customer.subscription.deleted           (hosting renewals / cancellations)
//   invoice.paid, invoice.payment_failed                                   (automatic hosting payments)
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Webhook not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    console.error("[stripe] invalid webhook signature", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.mode === "subscription") await onSubscriptionCheckout(session);
      else await invoicePaidByCheckout(session);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
    case "invoice.paid":
      await recordSubscriptionPayment(event.data.object);
      break;
    case "invoice.payment_failed":
      await subscriptionPaymentFailed(event.data.object);
      break;
  }

  return Response.json({ received: true });
}

/** A one-off Lumora invoice paid through Checkout ("Pay now" in the portal). */
async function invoicePaidByCheckout(session: Stripe.Checkout.Session) {
  const invoiceId = session.metadata?.invoiceId;
  if (!invoiceId || session.payment_status !== "paid") return;
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId }, include: { client: { select: { name: true, email: true } } } });
  if (!invoice || invoice.status === "PAID") return;
  if (session.amount_total !== invoice.total) {
    // Leave unpaid for manual review in the admin rather than silently accepting.
    console.error(`[stripe] amount mismatch for ${invoice.number}: paid ${session.amount_total}, expected ${invoice.total}`);
    return;
  }
  // Conditional update: if Stripe retries the event, only the first delivery sends emails.
  const { count } = await db.invoice.updateMany({
    where: { id: invoice.id, status: { not: "PAID" } },
    data: { status: "PAID", paidAt: new Date(), stripeSessionId: session.id },
  });
  if (count === 1) {
    await startProjectIfPaid(invoice.projectId);
    await Promise.all([
      emails.invoicePaid(invoice.client.email, invoice.client.name, invoice.id, invoice.number ?? "", invoice.total),
      emails.adminInvoicePaid(invoice.id, invoice.number ?? "", invoice.client.name, invoice.total),
    ]);
  }
}
