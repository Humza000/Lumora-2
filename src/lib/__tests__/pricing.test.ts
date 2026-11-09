import { describe, expect, it } from "vitest";
import { DEFAULT_PRICES, calculateEstimate, quoteAnswersSchema } from "../pricing";

describe("calculateEstimate", () => {
  it("returns zero for an empty draft", () => {
    const e = calculateEstimate({});
    expect(e.total).toBe(0);
    expect(e.lines).toHaveLength(0);
  });

  it("prices base type plus extra pages beyond the included amount", () => {
    const e = calculateEstimate({ projectType: "type_business", pages: 8 });
    // business includes 5 pages → 3 extra
    expect(e.total).toBe(DEFAULT_PRICES.type_business + 3 * DEFAULT_PRICES.extra_page);
  });

  it("adds features, design and extras", () => {
    const e = calculateEstimate({
      projectType: "type_landing",
      pages: 1,
      features: ["feat_booking", "feat_seo"],
      design: "design_custom",
      extras: ["extra_copywriting"],
    });
    expect(e.subtotal).toBe(
      DEFAULT_PRICES.type_landing +
        DEFAULT_PRICES.feat_booking +
        DEFAULT_PRICES.feat_seo +
        DEFAULT_PRICES.design_custom +
        DEFAULT_PRICES.extra_copywriting,
    );
  });

  it("applies the rush timeline percentage uplift", () => {
    const e = calculateEstimate({ projectType: "type_business", pages: 5, timeline: "timeline_rush" });
    expect(e.uplift).toBe(Math.round(DEFAULT_PRICES.type_business * 0.3));
    expect(e.total).toBe(e.subtotal + e.uplift);
  });

  it("returns a rounded range around the total", () => {
    const e = calculateEstimate({ projectType: "type_business", pages: 5 });
    expect(e.min).toBeLessThan(e.total);
    expect(e.max).toBeGreaterThan(e.total);
    expect(e.min % 5000).toBe(0);
    expect(e.max % 5000).toBe(0);
  });

  it("uses overridden prices when provided", () => {
    const e = calculateEstimate({ projectType: "type_landing", pages: 1 }, { ...DEFAULT_PRICES, type_landing: 12345 });
    expect(e.total).toBe(12345);
  });

  it("includes monthly hosting only when selected", () => {
    expect(calculateEstimate({ hosting: true }).monthlyHosting).toBe(DEFAULT_PRICES.hosting_monthly);
    expect(calculateEstimate({ hosting: false }).monthlyHosting).toBe(0);
  });
});

describe("quoteAnswersSchema", () => {
  const valid = {
    projectType: "type_business",
    pages: 5,
    features: [],
    design: "design_template",
    extras: [],
    timeline: "timeline_standard",
    budget: "Not sure yet",
    hosting: true,
    businessName: "Acme",
    goals: "Get more enquiries online",
  };

  it("accepts a complete submission", () => {
    expect(quoteAnswersSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects unknown feature keys", () => {
    expect(quoteAnswersSchema.safeParse({ ...valid, features: ["feat_hacker"] }).success).toBe(false);
  });

  it("requires goals of at least 10 characters", () => {
    expect(quoteAnswersSchema.safeParse({ ...valid, goals: "short" }).success).toBe(false);
  });
});
