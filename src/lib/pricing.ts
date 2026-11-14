// Quote wizard catalogue + estimate calculation.
// Pure module (no DB / server-only) so it can run in the browser for the live
// estimate AND on the server, where the submitted estimate is always recomputed.
// Admin-editable prices live in the PricingItem table; DEFAULT_PRICES seeds it
// and acts as a fallback for any missing key.
//
// Pricing model: the one-time development estimate is the project type's
// STARTING price. Features are scope information only and are never charged
// individually. Hosting & care is a separate, optional monthly plan.
import { z } from "zod";
import { formatGBP } from "./money";

export type PriceMap = Record<string, number>; // key -> pence

// Project type keys (`type_*`) are stored in quote answers, so they never change.
// Prices use separate `start_*` keys, so starting prices can be re-based without touching stored quotes.
export const PROJECT_TYPES = [
  {
    key: "type_landing",
    priceKey: "start_landing",
    label: "Landing page",
    description: "A single, high-converting page for a product, launch or campaign.",
    includedPages: 1,
  },
  {
    key: "type_business",
    priceKey: "start_business",
    label: "Business website",
    description: "A multi-page site that showcases your services and wins enquiries.",
    includedPages: 5,
  },
  {
    key: "type_ecommerce",
    priceKey: "start_ecommerce",
    label: "E-commerce store",
    description: "Sell products online with a full checkout experience.",
    includedPages: 5,
  },
  {
    key: "type_webapp",
    priceKey: "start_webapp",
    label: "Web app / custom build",
    description: "Portals, dashboards and bespoke functionality.",
    includedPages: 3,
  },
] as const;

export type ProjectTypeKey = (typeof PROJECT_TYPES)[number]["key"];

/** Requirement options per project type. Used to understand scope, never priced individually. */
export const FEATURES_BY_TYPE: Record<ProjectTypeKey, readonly { key: string; label: string }[]> = {
  type_landing: [
    { key: "landing_contact_form", label: "Contact form" },
    { key: "landing_gallery", label: "Image gallery" },
    { key: "landing_social", label: "Social media links" },
    { key: "landing_testimonials", label: "Customer testimonials" },
    { key: "landing_cta", label: "Call-to-action sections" },
    { key: "landing_maps", label: "Google Maps" },
  ],
  type_business: [
    { key: "business_forms", label: "Contact/enquiry forms" },
    { key: "business_galleries", label: "Image galleries" },
    { key: "business_services", label: "Services showcase" },
    { key: "business_testimonials", label: "Testimonials and reviews" },
    { key: "business_blog", label: "Blog/news section" },
    { key: "business_maps", label: "Google Maps" },
    { key: "business_service_pages", label: "Multiple service pages" },
    { key: "business_booking", label: "Booking functionality" },
  ],
  type_ecommerce: [
    { key: "shop_catalogue", label: "Product catalogue" },
    { key: "shop_cart", label: "Shopping cart" },
    { key: "shop_payments", label: "Online payments" },
    { key: "shop_categories", label: "Product categories" },
    { key: "shop_accounts", label: "Customer accounts" },
    { key: "shop_orders", label: "Order management" },
    { key: "shop_delivery", label: "Delivery options" },
    { key: "shop_discounts", label: "Discount codes" },
  ],
  type_webapp: [
    { key: "app_auth", label: "User authentication" },
    { key: "app_dashboards", label: "Customer dashboards" },
    { key: "app_membership", label: "Membership systems" },
    { key: "app_booking", label: "Booking systems" },
    { key: "app_calculators", label: "Custom calculators" },
    { key: "app_database", label: "Database functionality" },
    { key: "app_integrations", label: "Third-party integrations" },
    { key: "app_other", label: "Other custom functionality" },
  ],
};

export const ALL_FEATURES = Object.values(FEATURES_BY_TYPE).flat();

export const featureLabel = (key: string) => ALL_FEATURES.find((f) => f.key === key)?.label ?? key;

/** Features valid for a project type (drops options left over from a different type). */
export function featuresForType(type: string | undefined, selected: readonly string[] = []) {
  const valid = FEATURES_BY_TYPE[type as ProjectTypeKey] ?? [];
  return valid.filter((f) => selected.includes(f.key)).map((f) => f.key);
}

export const HOSTING_PLANS = [
  {
    key: "hosting_none",
    label: "No hosting required",
    description: "You arrange your own hosting.",
    includes: ["No monthly charge"],
  },
  {
    key: "hosting_basic",
    label: "Basic hosting",
    description: "Reliable hosting for your new site.",
    includes: ["Website hosting", "SSL certificate"],
  },
  {
    key: "hosting_standard",
    label: "Standard care",
    description: "Hosting plus ongoing maintenance.",
    includes: ["Website hosting", "SSL certificate", "Regular backups", "Software updates"],
  },
  {
    key: "hosting_premium",
    label: "Premium care",
    description: "Hands-off care with priority help.",
    includes: ["Everything in Standard", "Small content updates", "Priority support"],
  },
] as const;

export type HostingPlanKey = (typeof HOSTING_PLANS)[number]["key"];

export const DEFAULT_PRICES: PriceMap = {
  start_landing: 5000,
  start_business: 10000,
  start_ecommerce: 25000,
  start_webapp: 40000,
  hosting_none: 0,
  hosting_basic: 500,
  hosting_standard: 1000,
  hosting_premium: 1500,
};

/** Labels + categories used to seed/edit the PricingItem table. */
export const PRICING_CATALOGUE: { key: string; label: string; category: string }[] = [
  ...PROJECT_TYPES.map((t) => ({ key: t.priceKey, label: `${t.label} (starting price)`, category: "Project type" })),
  ...HOSTING_PLANS.filter((p) => p.key !== "hosting_none").map((p) => ({
    key: p.key,
    label: `${p.label} (per month)`,
    category: "Hosting & care",
  })),
];

const keysOf = <T extends readonly { key: string }[]>(arr: T) =>
  arr.map((a) => a.key) as unknown as [T[number]["key"], ...T[number]["key"][]];

const quoteFields = z.object({
  projectType: z.enum(keysOf(PROJECT_TYPES)),
  pages: z.coerce.number().int().min(1).max(100),
  // Kept loose so drafts saved before the catalogue changed still load; checked on submit.
  features: z.array(z.string().max(60)).max(30).default([]),
  featuresOther: z.string().trim().max(2000).default(""),
  hostingPlan: z.enum(keysOf(HOSTING_PLANS)),
  businessName: z.string().trim().min(1, "Tell us your business name").max(120),
  industry: z.string().trim().max(120).default(""),
  existingSite: z.string().trim().max(300).default(""),
  goals: z.string().trim().min(10, "Give us a little more detail (10+ characters)").max(4000),
  notes: z.string().trim().max(4000).default(""),
});

/** A complete submission. Every selected feature must belong to the chosen project type. */
export const quoteAnswersSchema = quoteFields.superRefine((a, ctx) => {
  const valid = new Set(FEATURES_BY_TYPE[a.projectType].map((f) => f.key));
  if (a.features.some((k) => !valid.has(k))) {
    ctx.addIssue({ code: "custom", path: ["features"], message: "Some selected features don't match your project type." });
  }
});

export type QuoteAnswers = z.infer<typeof quoteAnswersSchema>;

/** Draft answers are partial and loosely validated (unknown keys from older drafts are dropped). */
export const quoteDraftSchema = quoteFields.partial();
export type QuoteDraft = z.infer<typeof quoteDraftSchema>;

export const EMPTY_DRAFT: QuoteDraft = {
  pages: 5,
  features: [],
  featuresOther: "",
  businessName: "",
  industry: "",
  existingSite: "",
  goals: "",
  notes: "",
};

export type Estimate = {
  /** The chosen package, or null before a project type is picked. */
  projectType: (typeof PROJECT_TYPES)[number] | null;
  /** One-time development estimate (the package's starting price), pence. */
  oneTime: number;
  /** Optional recurring hosting & care, pence per month. */
  monthlyHosting: number;
  hostingPlan: (typeof HOSTING_PLANS)[number] | null;
  /** Requirements that usually need an individually tailored quote. */
  customQuote: boolean;
  // Stored on the Quote row (estimateMin/estimateMax). Both are the starting price.
  min: number;
  max: number;
};

const price = (prices: PriceMap, key: string) => prices[key] ?? DEFAULT_PRICES[key] ?? 0;

/** Web apps, "other custom functionality" or extra written requirements may need a tailored quote. */
export function needsCustomQuote(answers: QuoteDraft) {
  return (
    answers.projectType === "type_webapp" ||
    (answers.features ?? []).includes("app_other") ||
    (answers.featuresOther ?? "").trim().length > 0
  );
}

/** Indicative estimate. Works with partial (draft) answers. Features never change the price. */
export function calculateEstimate(answers: QuoteDraft, prices: PriceMap = DEFAULT_PRICES): Estimate {
  const projectType = PROJECT_TYPES.find((t) => t.key === answers.projectType) ?? null;
  const hostingPlan = HOSTING_PLANS.find((p) => p.key === answers.hostingPlan) ?? null;
  const oneTime = projectType ? price(prices, projectType.priceKey) : 0;
  return {
    projectType,
    oneTime,
    monthlyHosting: hostingPlan ? price(prices, hostingPlan.key) : 0,
    hostingPlan,
    customQuote: needsCustomQuote(answers),
    min: oneTime,
    max: oneTime,
  };
}

/**
 * Stored estimates as text. New quotes store their starting price in both columns ("From £100");
 * older quotes stored a range ("£540 – £720").
 */
export function formatEstimate(min: number, max: number) {
  if (min === max) return `From ${formatGBP(min, { whole: true })}`;
  return `${formatGBP(min, { whole: true })} – ${formatGBP(max, { whole: true })}`;
}
