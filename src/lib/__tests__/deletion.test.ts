import { describe, expect, it } from "vitest";
import { canDeleteInvoice, quoteDeleteBlocker } from "../deletion";

describe("canDeleteInvoice", () => {
  it.each(["DRAFT", "SENT", "OVERDUE", "VOID"])("allows %s", (s) => expect(canDeleteInvoice(s)).toBe(true));
  it("refuses PAID", () => expect(canDeleteInvoice("PAID")).toBe(false));
});

describe("quoteDeleteBlocker", () => {
  it("allows a quote with no paid invoices or hosting", () => {
    expect(quoteDeleteBlocker({ paidInvoices: 0, hasHostingPlan: false })).toBeNull();
  });
  it("refuses when an invoice is paid", () => {
    expect(quoteDeleteBlocker({ paidInvoices: 1, hasHostingPlan: false })).toMatch(/paid invoices/);
  });
  it("refuses when the project has a hosting plan", () => {
    expect(quoteDeleteBlocker({ paidInvoices: 0, hasHostingPlan: true })).toMatch(/hosting plan/);
  });
});
