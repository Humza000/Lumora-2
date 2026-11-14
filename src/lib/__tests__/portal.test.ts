import { describe, expect, it } from "vitest";
import { portalNextStep, quoteStatusNote } from "../portal";

const base = { verified: true, unpaidInvoices: 0, draftQuotes: 0, quotesInReview: 0, activeProjects: 0 };

describe("portalNextStep", () => {
  it("asks unverified clients to verify before anything else", () => {
    expect(portalNextStep({ ...base, verified: false, unpaidInvoices: 2, activeProjects: 1 })).toBe("verify");
  });

  it("puts unpaid invoices ahead of quotes and projects", () => {
    expect(portalNextStep({ ...base, unpaidInvoices: 1, draftQuotes: 1, quotesInReview: 1, activeProjects: 1 })).toBe("pay");
  });

  it("then drafts, quotes in review, active projects", () => {
    expect(portalNextStep({ ...base, draftQuotes: 1, quotesInReview: 1, activeProjects: 1 })).toBe("draft");
    expect(portalNextStep({ ...base, quotesInReview: 1, activeProjects: 1 })).toBe("review");
    expect(portalNextStep({ ...base, activeProjects: 1 })).toBe("project");
  });

  it("invites a new quote when there is nothing else", () => {
    expect(portalNextStep(base)).toBe("start");
  });
});

describe("quoteStatusNote", () => {
  it("explains statuses clients see and stays quiet for drafts", () => {
    expect(quoteStatusNote("SUBMITTED")).toMatch(/2 working days/);
    expect(quoteStatusNote("REVIEWING")).toMatch(/2 working days/);
    expect(quoteStatusNote("ACCEPTED")).toMatch(/Projects/);
    expect(quoteStatusNote("DRAFT")).toBeNull();
  });
});
