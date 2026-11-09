import { describe, expect, it } from "vitest";
import { calculateTotals, effectiveStatus, formatInvoiceNumber } from "../invoice";
import { advanceRenewal, monthlyValue } from "../hosting";
import { formatGBP, poundsToPence } from "../money";
import { projectProgress } from "../progress";
import { safeNext } from "../validation";

describe("invoice helpers", () => {
  it("formats sequential invoice numbers", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("LUM-2026-0001");
    expect(formatInvoiceNumber(2026, 1234)).toBe("LUM-2026-1234");
  });

  it("calculates subtotal, VAT and total in pence", () => {
    const t = calculateTotals(
      [
        { description: "Design", quantity: 1, unitPrice: 100000 },
        { description: "Pages", quantity: 3, unitPrice: 10050 },
      ],
      20,
    );
    expect(t.subtotal).toBe(130150);
    expect(t.vat).toBe(26030);
    expect(t.total).toBe(156180);
  });

  it("treats sent invoices past due as overdue", () => {
    const past = new Date("2026-01-01");
    const now = new Date("2026-02-01");
    expect(effectiveStatus("SENT", past, now)).toBe("OVERDUE");
    expect(effectiveStatus("PAID", past, now)).toBe("PAID");
    expect(effectiveStatus("SENT", new Date("2026-03-01"), now)).toBe("SENT");
  });
});

describe("money", () => {
  it("parses pounds to pence", () => {
    expect(poundsToPence("1,250.50")).toBe(125050);
    expect(poundsToPence("£49")).toBe(4900);
    expect(poundsToPence("0.1")).toBe(10);
    expect(Number.isNaN(poundsToPence("abc"))).toBe(true);
    expect(Number.isNaN(poundsToPence("1.234"))).toBe(true);
  });

  it("formats GBP", () => {
    expect(formatGBP(125050)).toBe("£1,250.50");
    expect(formatGBP(150000, { whole: true })).toBe("£1,500");
  });
});

describe("hosting", () => {
  it("advances monthly renewals and clamps month-end", () => {
    expect(advanceRenewal(new Date(2026, 0, 31), "MONTHLY")).toEqual(new Date(2026, 1, 28));
    expect(advanceRenewal(new Date(2026, 4, 15), "MONTHLY")).toEqual(new Date(2026, 5, 15));
  });

  it("advances annual renewals", () => {
    expect(advanceRenewal(new Date(2026, 4, 15), "ANNUAL")).toEqual(new Date(2027, 4, 15));
  });

  it("computes monthly-equivalent value", () => {
    expect(monthlyValue(4900, "MONTHLY")).toBe(4900);
    expect(monthlyValue(60000, "ANNUAL")).toBe(5000);
  });
});

describe("projectProgress", () => {
  it("counts done as 1 and in-progress as 0.5", () => {
    expect(projectProgress([])).toBe(0);
    expect(projectProgress([{ status: "DONE" }, { status: "IN_PROGRESS" }, { status: "PENDING" }, { status: "PENDING" }])).toBe(38);
    expect(projectProgress([{ status: "DONE" }, { status: "DONE" }])).toBe(100);
  });
});

describe("safeNext", () => {
  it("only allows same-site relative paths", () => {
    expect(safeNext("/portal", "/x")).toBe("/portal");
    expect(safeNext("//evil.com", "/x")).toBe("/x");
    expect(safeNext("https://evil.com", "/x")).toBe("/x");
    expect(safeNext(null, "/x")).toBe("/x");
  });
});
