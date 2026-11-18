import { describe, expect, it } from "vitest";
import {
  answerChanges,
  balanceInvoiceLines,
  canRespond,
  canSendOffer,
  hostingFromQuote,
  offerHosting,
  offerInvoiceAmount,
  offerInvoiceLines,
  websiteBalance,
} from "../quote-offer";

const offer = { price: 25000, hostingPlanKey: "hosting_standard", hostingBilling: "monthly", hostingPrice: 1000 };

describe("quote offer statuses", () => {
  it("lets the admin send after submission or a change request, re-send while waiting, and after a decline", () => {
    expect(["SUBMITTED", "REVIEWING", "CHANGES_REQUESTED", "SENT", "DECLINED"].every(canSendOffer)).toBe(true);
    expect(canSendOffer("DRAFT")).toBe(false);
    expect(canSendOffer("ACCEPTED")).toBe(false);
  });

  it("lets the client respond only to a sent quote", () => {
    expect(canRespond("SENT")).toBe(true);
    expect(["DRAFT", "SUBMITTED", "REVIEWING", "CHANGES_REQUESTED", "ACCEPTED", "DECLINED"].some(canRespond)).toBe(false);
  });
});

describe("offerHosting", () => {
  it("describes the confirmed plan and price", () => {
    expect(offerHosting(offer)).toBe("Standard care, £10/month");
    expect(offerHosting({ ...offer, hostingBilling: "yearly", hostingPrice: 9950 })).toBe("Standard care, £99.50/year");
    expect(offerHosting({ ...offer, hostingPlanKey: "hosting_none", hostingPrice: 0 })).toBe("No hosting required");
    expect(offerHosting({ ...offer, hostingPlanKey: null })).toBeNull();
  });
});

describe("website invoice on acceptance", () => {
  it("bills the full price or half as a deposit", () => {
    expect(offerInvoiceAmount(25000, "full")).toBe(25000);
    expect(offerInvoiceAmount(25001, "deposit")).toBe(12501);
    expect(offerInvoiceAmount(null, "full")).toBe(0);
  });

  it("builds one line for the build, never hosting", () => {
    expect(offerInvoiceLines(25000, "full", "Business website")).toEqual([
      { description: "Business website: website design & build", quantity: 1, unitPrice: 25000 },
    ]);
    expect(offerInvoiceLines(25000, "deposit", null)).toEqual([
      { description: "Website: website design & build (50% deposit)", quantity: 1, unitPrice: 12500 },
    ]);
    expect(offerInvoiceLines(0, "full", "X")).toEqual([]);
  });
});

describe("hostingFromQuote", () => {
  it("turns the accepted hosting into a plan to start at launch", () => {
    expect(hostingFromQuote(offer)).toEqual({ planKey: "hosting_standard", planName: "Standard care", price: 1000, interval: "MONTHLY", includesMaintenance: true });
    expect(hostingFromQuote({ hostingPlanKey: "hosting_basic", hostingBilling: "yearly", hostingPrice: 5000 })).toMatchObject({ interval: "ANNUAL", includesMaintenance: false });
  });

  it("is null without paid hosting", () => {
    expect(hostingFromQuote({ hostingPlanKey: "hosting_none", hostingBilling: "monthly", hostingPrice: 0 })).toBeNull();
    expect(hostingFromQuote({ hostingPlanKey: null, hostingBilling: null, hostingPrice: null })).toBeNull();
  });
});

describe("answerChanges", () => {
  const base = { projectType: "type_business", pages: 5, features: ["business_maps"], hostingPlan: "hosting_standard", hostingBilling: "monthly", businessName: "Bakery", goals: "More orders please" };

  it("lists only what the client changed", () => {
    expect(answerChanges(base, { ...base, pages: 8, hostingBilling: "yearly" })).toEqual([
      { label: "Pages", from: "5", to: "8" },
      { label: "Hosting billed", from: "monthly", to: "yearly" },
    ]);
    expect(answerChanges(base, base)).toEqual([]);
  });

  it("copes with missing or unreadable answers", () => {
    expect(answerChanges(null, base)).toEqual([]);
  });
});

describe("websiteBalance", () => {
  const inv = (subtotal: number, status: string, hostingPlanId: string | null = null) => ({ subtotal, status, hostingPlanId });

  it("leaves half to invoice after a deposit, and counts the unpaid part", () => {
    expect(websiteBalance(25000, [inv(12500, "PAID")])).toEqual({ toInvoice: 12500, unpaid: 0 });
    expect(websiteBalance(25000, [inv(12500, "PAID"), inv(12500, "SENT")])).toEqual({ toInvoice: 0, unpaid: 12500 });
    expect(websiteBalance(25000, [inv(12500, "PAID"), inv(12500, "PAID")])).toEqual({ toInvoice: 0, unpaid: 0 });
  });

  it("ignores void and hosting invoices, and never goes below zero", () => {
    expect(websiteBalance(25000, [inv(12500, "PAID"), inv(12500, "VOID"), inv(1000, "PAID", "plan")])).toEqual({ toInvoice: 12500, unpaid: 0 });
    expect(websiteBalance(25000, [inv(30000, "PAID")]).toInvoice).toBe(0);
  });

  it("an odd price: deposit plus balance add up to the full price", () => {
    const deposit = offerInvoiceAmount(25001, "deposit");
    const { toInvoice } = websiteBalance(25001, [inv(deposit, "PAID")]);
    expect(deposit + toInvoice).toBe(25001);
  });
});

describe("balanceInvoiceLines", () => {
  it("bills the balance as one line, or nothing", () => {
    expect(balanceInvoiceLines(12500, "Business website")).toEqual([
      { description: "Business website: website design & build (balance)", quantity: 1, unitPrice: 12500 },
    ]);
    expect(balanceInvoiceLines(0, null)).toEqual([]);
  });
});
