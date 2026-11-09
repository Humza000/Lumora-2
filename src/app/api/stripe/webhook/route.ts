import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Stripe → POST /api/stripe/webhook. Configure in the Stripe dashboard (or `stripe listen`)
// for the checkout.session.completed event.
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

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoiceId;
    if (invoiceId && session.payment_status === "paid") {
      const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
      if (invoice && invoice.status !== "PAID") {
        if (session.amount_total !== invoice.total) {
          // Leave unpaid for manual review in the admin rather than silently accepting.
          console.error(`[stripe] amount mismatch for ${invoice.number}: paid ${session.amount_total}, expected ${invoice.total}`);
          return Response.json({ received: true });
        }
        await db.invoice.update({
          where: { id: invoice.id },
          data: { status: "PAID", paidAt: new Date(), stripeSessionId: session.id },
        });
      }
    }
  }

  return Response.json({ received: true });
}
