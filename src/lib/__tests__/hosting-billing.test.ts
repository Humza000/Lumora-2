import { describe, expect, it } from "vitest";
import { awaitingFirstPayment, firstCharge, hostingBillingState, startPlanPrices } from "../hosting";

const now = new Date("2026-11-15T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86400_000);

describe("firstCharge", () => {
  it("waits until the renewal date when the current period is already paid", () => {
    expect(firstCharge(days(20), now)).toEqual({ kind: "on", at: days(20) });
    expect(firstCharge(days(300), now)).toEqual({ kind: "on", at: days(300) }); // yearly plans
  });

  it("charges now when renewal is due (or overdue)", () => {
    expect(firstCharge(days(1), now)).toEqual({ kind: "now" });
    expect(firstCharge(days(-5), now)).toEqual({ kind: "now" });
  });
});

describe("hostingBillingState", () => {
  const base = { status: "ACTIVE" as const, stripeSubscriptionId: null, subscriptionStatus: null, cancelAt: null };

  it("is manual (invoiced) until a card subscription exists", () => {
    expect(hostingBillingState(base)).toBe("manual");
  });

  it("tracks an active, failing, cancelling and cancelled subscription", () => {
    const sub = { ...base, stripeSubscriptionId: "sub_1", subscriptionStatus: "active" };
    expect(hostingBillingState(sub)).toBe("active");
    expect(hostingBillingState({ ...sub, subscriptionStatus: "trialing" })).toBe("active");
    expect(hostingBillingState({ ...sub, subscriptionStatus: "past_due" })).toBe("past_due");
    expect(hostingBillingState({ ...sub, cancelAt: days(10) })).toBe("cancelling");
    expect(hostingBillingState({ ...sub, subscriptionStatus: "canceled" })).toBe("cancelled");
    expect(hostingBillingState({ ...base, status: "CANCELLED" })).toBe("cancelled");
  });

  it("lets invoiced (manual) plans be cancelled too, ending on the cancel date", () => {
    expect(hostingBillingState({ ...base, cancelAt: days(10) }, now)).toBe("cancelling");
    expect(hostingBillingState({ ...base, cancelAt: days(-1) }, now)).toBe("cancelled");
  });
});

describe("starting a plan after launch", () => {
  const plan = { planKey: "hosting_standard", stripeSubscriptionId: null, status: "ACTIVE", cancelAt: null };

  it("waits for a first payment only for launch plans that have never been billed", () => {
    expect(awaitingFirstPayment(plan, 0)).toBe(true);
    expect(awaitingFirstPayment(plan, 1)).toBe(false);
    expect(awaitingFirstPayment({ ...plan, planKey: null }, 0)).toBe(false);
    expect(awaitingFirstPayment({ ...plan, stripeSubscriptionId: "sub_1" }, 0)).toBe(false);
    expect(awaitingFirstPayment({ ...plan, cancelAt: new Date() }, 0)).toBe(false);
  });

  it("keeps the quoted price for the quoted interval", () => {
    expect(startPlanPrices({ interval: "MONTHLY", price: 1200 }, { monthly: 1000, yearly: 10000 })).toEqual({ MONTHLY: 1200, ANNUAL: 10000 });
    expect(startPlanPrices({ interval: "ANNUAL", price: 9000 }, { monthly: 1000, yearly: 10000 })).toEqual({ MONTHLY: 1000, ANNUAL: 9000 });
  });
});
