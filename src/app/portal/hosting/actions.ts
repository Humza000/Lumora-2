"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { awaitingFirstPayment } from "@/lib/hosting";
import { planStartPrices } from "@/lib/hosting-start";
import { billingPortalUrl, cancelHosting, loadHostingPlan, resumeHosting, startHostingCheckout } from "@/lib/hosting-billing";
import { stripeEnabled } from "@/lib/stripe";
import type { ActionState } from "@/lib/action-state";

/** The signed-in client's own plan, or null (other clients' plans are never reachable). */
async function ownPlan(planId: string) {
  const user = await requireClient();
  const plan = await loadHostingPlan({ id: planId });
  return plan && plan.clientId === user.id ? plan : null;
}

const UNAVAILABLE = "Card payments aren't available right now. Please contact us and we'll sort it out.";

export async function setUpAutomaticPayments(planId: string): Promise<ActionState> {
  const plan = await ownPlan(planId);
  if (!plan || plan.status !== "ACTIVE" || plan.cancelAt) return { error: "This plan can't be set up for automatic payments." };
  if (plan.stripeSubscriptionId) return { error: "Automatic payments are already set up for this plan." };
  if (!stripeEnabled()) return { error: UNAVAILABLE };
  let url: string;
  try {
    url = await startHostingCheckout(plan);
  } catch (err) {
    console.error("[hosting] checkout failed", err);
    return { error: UNAVAILABLE };
  }
  redirect(url);
}

export async function cancelPlan(planId: string): Promise<ActionState> {
  const plan = await ownPlan(planId);
  if (!plan || plan.status === "CANCELLED") return { error: "This plan can't be cancelled." };
  if (plan.cancelAt) return { ok: true, message: "This plan is already cancelled." };
  try {
    await cancelHosting(plan);
  } catch (err) {
    console.error("[hosting] cancel failed", err);
    return { error: "We couldn't cancel your plan just now. Please try again, or contact us." };
  }
  revalidatePath("/portal/hosting");
  redirect("/portal/hosting?cancelled=1");
}

export async function keepPlan(planId: string): Promise<ActionState> {
  const plan = await ownPlan(planId);
  if (!plan || !plan.cancelAt || plan.cancelAt <= new Date()) return { error: "This plan can't be restarted here. Please contact us." };
  try {
    await resumeHosting(plan);
  } catch (err) {
    console.error("[hosting] resume failed", err);
    return { error: "We couldn't restart your plan just now. Please try again, or contact us." };
  }
  revalidatePath("/portal/hosting");
  // The "keep" button disappears once the plan is active again, so confirm via the page.
  redirect("/portal/hosting?kept=1");
}

export async function manageCard(planId: string): Promise<ActionState> {
  const plan = await ownPlan(planId);
  const customer = plan?.client.profile?.stripeCustomerId;
  if (!customer || !stripeEnabled()) return { error: UNAVAILABLE };
  let url: string;
  try {
    url = await billingPortalUrl(customer);
  } catch (err) {
    console.error("[hosting] billing portal failed", err);
    return { error: "Card details can't be changed online right now. Please contact us and we'll help." };
  }
  redirect(url);
}

/**
 * First hosting payment after launch: the client picks monthly or yearly, pays by card on Stripe
 * (which saves the card), and the plan then renews automatically.
 */
export async function startPlan(planId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const plan = await ownPlan(planId);
  const interval = z.enum(["MONTHLY", "ANNUAL"]).safeParse(fd.get("interval"));
  if (!plan || !interval.success) return { error: "Choose monthly or yearly to start your plan." };
  const invoices = await db.invoice.count({ where: { hostingPlanId: plan.id } });
  if (!awaitingFirstPayment(plan, invoices)) return { error: "This plan has already been started." };
  if (!stripeEnabled()) return { error: UNAVAILABLE };

  // Prices come from the server (quote + price list), never from the form.
  const price = (await planStartPrices(plan))[interval.data];
  if (!price) return { error: UNAVAILABLE };
  await db.hostingPlan.update({ where: { id: plan.id }, data: { interval: interval.data, price, renewalDate: new Date() } });
  let url: string;
  try {
    url = await startHostingCheckout({ ...plan, interval: interval.data, price, renewalDate: new Date() });
  } catch (err) {
    console.error("[hosting] start plan checkout failed", err);
    return { error: UNAVAILABLE };
  }
  redirect(url);
}
