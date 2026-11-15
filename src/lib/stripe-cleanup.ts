import "server-only";
import { getStripe, stripeEnabled } from "./stripe";

/**
 * Before deleting unpaid invoices: expire any Checkout page the client still has open for them,
 * so they can't pay an invoice that no longer exists. Best effort: a session that has already
 * expired or completed is skipped.
 */
export async function expireCheckoutSessions(sessionIds: (string | null)[]) {
  if (!stripeEnabled()) return;
  const stripe = getStripe();
  await Promise.all(
    sessionIds.filter((id): id is string => Boolean(id)).map(async (id) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(id);
        if (session.status === "open") await stripe.checkout.sessions.expire(id);
      } catch (err) {
        console.error(`[stripe] couldn't expire checkout session ${id}`, err);
      }
    }),
  );
}
