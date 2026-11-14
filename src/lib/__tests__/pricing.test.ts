import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICES,
  FEATURES_BY_TYPE,
  calculateEstimate,
  featuresForType,
  formatEstimate,
  quoteAnswersSchema,
} from "../pricing";

describe("starting prices", () => {
  it("match the published prices, with the web app not capped below e-commerce", () => {
    expect(DEFAULT_PRICES.start_landing).toBe(5000);
    expect(DEFAULT_PRICES.start_business).toBe(10000);
    expect(DEFAULT_PRICES.start_ecommerce).toBe(25000);
    expect(DEFAULT_PRICES.start_webapp).toBe(40000);
    expect(calculateEstimate({ projectType: "type_webapp" }).oneTime).toBe(40000);
  });

  it("price hosting & care monthly", () => {
    expect([DEFAULT_PRICES.hosting_none, DEFAULT_PRICES.hosting_basic, DEFAULT_PRICES.hosting_standard, DEFAULT_PRICES.hosting_premium]).toEqual([
      0, 500, 1000, 1500,
    ]);
  });
});

describe("calculateEstimate", () => {
  it("returns zero for an empty draft", () => {
    const e = calculateEstimate({});
    expect(e.oneTime).toBe(0);
    expect(e.monthlyHosting).toBe(0);
    expect(e.projectType).toBeNull();
  });

  it("is the package starting price; features and pages never add to it", () => {
    const plain = calculateEstimate({ projectType: "type_business", pages: 5 });
    const loaded = calculateEstimate({
      projectType: "type_business",
      pages: 20,
      features: FEATURES_BY_TYPE.type_business.map((f) => f.key),
    });
    expect(plain.oneTime).toBe(10000);
    expect(loaded.oneTime).toBe(10000);
    expect(loaded.min).toBe(10000);
    expect(loaded.max).toBe(10000);
  });

  it("keeps hosting separate from the one-time cost", () => {
    const e = calculateEstimate({ projectType: "type_landing", hostingPlan: "hosting_standard" });
    expect(e.oneTime).toBe(5000);
    expect(e.monthlyHosting).toBe(1000);
    expect(calculateEstimate({ projectType: "type_landing", hostingPlan: "hosting_none" }).monthlyHosting).toBe(0);
  });

  it("uses overridden (admin) prices when provided", () => {
    const prices = { ...DEFAULT_PRICES, start_landing: 7500, hosting_premium: 2000 };
    const e = calculateEstimate({ projectType: "type_landing", hostingPlan: "hosting_premium" }, prices);
    expect(e.oneTime).toBe(7500);
    expect(e.monthlyHosting).toBe(2000);
  });

  it("flags requirements that may need a custom quote", () => {
    expect(calculateEstimate({ projectType: "type_business" }).customQuote).toBe(false);
    expect(calculateEstimate({ projectType: "type_webapp" }).customQuote).toBe(true);
    expect(calculateEstimate({ projectType: "type_business", featuresOther: "Live chat" }).customQuote).toBe(true);
  });
});

describe("featuresForType", () => {
  it("keeps only the options that belong to the chosen project type", () => {
    expect(featuresForType("type_landing", ["landing_maps", "shop_cart", "feat_booking"])).toEqual(["landing_maps"]);
    expect(featuresForType(undefined, ["landing_maps"])).toEqual([]);
  });
});

describe("formatEstimate", () => {
  it("shows a starting price, and still shows ranges stored on older quotes", () => {
    expect(formatEstimate(10000, 10000)).toBe("From £100");
    expect(formatEstimate(54000, 72000)).toBe("£540 – £720");
  });
});

describe("quoteAnswersSchema", () => {
  const valid = {
    projectType: "type_business",
    pages: 5,
    features: ["business_forms", "business_maps"],
    featuresOther: "",
    hostingPlan: "hosting_basic",
    businessName: "Acme",
    goals: "Get more enquiries online",
  };

  it("accepts a complete submission", () => {
    expect(quoteAnswersSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects features from another project type or unknown keys", () => {
    expect(quoteAnswersSchema.safeParse({ ...valid, features: ["shop_cart"] }).success).toBe(false);
    expect(quoteAnswersSchema.safeParse({ ...valid, features: ["feat_hacker"] }).success).toBe(false);
  });

  it("requires a hosting choice (which may be no hosting)", () => {
    expect(quoteAnswersSchema.safeParse({ ...valid, hostingPlan: undefined }).success).toBe(false);
    expect(quoteAnswersSchema.safeParse({ ...valid, hostingPlan: "hosting_none" }).success).toBe(true);
  });

  it("requires goals of at least 10 characters", () => {
    expect(quoteAnswersSchema.safeParse({ ...valid, goals: "short" }).success).toBe(false);
  });
});
