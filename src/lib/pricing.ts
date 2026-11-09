// Quote wizard catalogue + estimate calculation.
// Pure module (no DB / server-only) so it can run in the browser for the live
// estimate AND on the server, where the submitted estimate is always recomputed.
// Admin-editable prices live in the PricingItem table; DEFAULT_PRICES seeds it
// and acts as a fallback for any missing key.
import { z } from "zod";

export type PriceMap = Record<string, number>; // key -> pence (or percent for timeline)

export const PROJECT_TYPES = [
  { key: "type_landing", label: "Landing page", description: "A single, high-converting page for a product, launch or campaign.", includedPages: 1 },
  { key: "type_business", label: "Business website", description: "A multi-page site that showcases your services and wins enquiries.", includedPages: 5 },
  { key: "type_ecommerce", label: "E-commerce store", description: "Sell products online with a full checkout experience.", includedPages: 5 },
  { key: "type_webapp", label: "Web app / custom build", description: "Portals, dashboards and bespoke functionality.", includedPages: 3 },
] as const;

export const FEATURES = [
  { key: "feat_booking", label: "Online booking / appointments" },
  { key: "feat_payments", label: "Online payments" },
  { key: "feat_membership", label: "Memberships / customer accounts" },
  { key: "feat_blog", label: "Blog / news" },
  { key: "feat_cms", label: "Editable content (CMS)" },
  { key: "feat_quote_calc", label: "Instant quote calculator" },
  { key: "feat_multilingual", label: "Multiple languages" },
  { key: "feat_integrations", label: "Third-party integrations (CRM, email, etc.)" },
  { key: "feat_seo", label: "SEO setup & optimisation" },
] as const;

export const DESIGN_OPTIONS = [
  { key: "design_template", label: "Refined template", description: "A premium starting point tailored to your brand." },
  { key: "design_custom", label: "Fully bespoke design", description: "Custom design from scratch, unique to you." },
] as const;

export const EXTRAS = [
  { key: "extra_branding", label: "Logo & brand identity" },
  { key: "extra_copywriting", label: "Professional copywriting" },
] as const;

export const TIMELINES = [
  { key: "timeline_flexible", label: "Flexible", description: "No fixed deadline" },
  { key: "timeline_standard", label: "Standard", description: "Within 6–8 weeks" },
  { key: "timeline_rush", label: "Rush", description: "Within 2–4 weeks" },
] as const;

export const BUDGETS = [
  "Under £1,000",
  "£1,000 – £2,500",
  "£2,500 – £5,000",
  "£5,000 – £10,000",
  "£10,000+",
  "Not sure yet",
] as const;

export const EXTRA_PAGE_KEY = "extra_page";
export const HOSTING_KEY = "hosting_monthly";

export const DEFAULT_PRICES: PriceMap = {
  type_landing: 60000,
  type_business: 150000,
  type_ecommerce: 300000,
  type_webapp: 500000,
  [EXTRA_PAGE_KEY]: 10000,
  feat_booking: 45000,
  feat_payments: 35000,
  feat_membership: 80000,
  feat_blog: 30000,
  feat_cms: 40000,
  feat_quote_calc: 50000,
  feat_multilingual: 50000,
  feat_integrations: 40000,
  feat_seo: 25000,
  design_template: 0,
  design_custom: 80000,
  extra_branding: 60000,
  extra_copywriting: 30000,
  timeline_flexible: 0, // percent uplift
  timeline_standard: 0,
  timeline_rush: 30,
  [HOSTING_KEY]: 4900,
};

/** Labels + categories used to seed/edit the PricingItem table. */
export const PRICING_CATALOGUE: { key: string; label: string; category: string }[] = [
  ...PROJECT_TYPES.map((t) => ({ key: t.key, label: t.label, category: "Project type" })),
  { key: EXTRA_PAGE_KEY, label: "Each additional page", category: "Pages" },
  ...FEATURES.map((f) => ({ key: f.key, label: f.label, category: "Features" })),
  ...DESIGN_OPTIONS.map((d) => ({ key: d.key, label: d.label, category: "Design" })),
  ...EXTRAS.map((e) => ({ key: e.key, label: e.label, category: "Extras" })),
  ...TIMELINES.map((t) => ({ key: t.key, label: `${t.label} timeline (% uplift)`, category: "Timeline" })),
  { key: HOSTING_KEY, label: "Hosting & maintenance (per month)", category: "Hosting" },
];

const keysOf = <T extends readonly { key: string }[]>(arr: T) =>
  arr.map((a) => a.key) as unknown as [T[number]["key"], ...T[number]["key"][]];

export const quoteAnswersSchema = z.object({
  projectType: z.enum(keysOf(PROJECT_TYPES)),
  pages: z.coerce.number().int().min(1).max(100),
  features: z.array(z.enum(keysOf(FEATURES))).default([]),
  design: z.enum(keysOf(DESIGN_OPTIONS)),
  extras: z.array(z.enum(keysOf(EXTRAS))).default([]),
  timeline: z.enum(keysOf(TIMELINES)),
  budget: z.enum(BUDGETS),
  hosting: z.boolean().default(true),
  businessName: z.string().trim().min(1, "Tell us your business name").max(120),
  industry: z.string().trim().max(120).default(""),
  existingSite: z.string().trim().max(300).default(""),
  goals: z.string().trim().min(10, "Give us a little more detail (10+ characters)").max(4000),
  notes: z.string().trim().max(4000).default(""),
});

export type QuoteAnswers = z.infer<typeof quoteAnswersSchema>;

/** Draft answers are partial and loosely validated. */
export const quoteDraftSchema = quoteAnswersSchema.partial();
export type QuoteDraft = z.infer<typeof quoteDraftSchema>;

export const EMPTY_DRAFT: QuoteDraft = {
  pages: 5,
  features: [],
  extras: [],
  design: "design_template",
  timeline: "timeline_standard",
  hosting: true,
  businessName: "",
  industry: "",
  existingSite: "",
  goals: "",
  notes: "",
};

export type EstimateLine = { label: string; amount: number };
export type Estimate = {
  lines: EstimateLine[];
  subtotal: number;
  uplift: number;
  total: number;
  min: number;
  max: number;
  monthlyHosting: number;
};

const price = (prices: PriceMap, key: string) => prices[key] ?? DEFAULT_PRICES[key] ?? 0;
const roundTo = (pence: number, step: number) => Math.round(pence / step) * step;

/** Indicative estimate. Works with partial (draft) answers. */
export function calculateEstimate(answers: QuoteDraft, prices: PriceMap = DEFAULT_PRICES): Estimate {
  const lines: EstimateLine[] = [];
  const type = PROJECT_TYPES.find((t) => t.key === answers.projectType);

  if (type) {
    lines.push({ label: type.label, amount: price(prices, type.key) });
    const extraPages = Math.max(0, (answers.pages ?? type.includedPages) - type.includedPages);
    if (extraPages > 0) {
      lines.push({
        label: `${extraPages} additional page${extraPages === 1 ? "" : "s"}`,
        amount: extraPages * price(prices, EXTRA_PAGE_KEY),
      });
    }
  }

  for (const f of FEATURES) {
    if (answers.features?.includes(f.key)) lines.push({ label: f.label, amount: price(prices, f.key) });
  }

  const design = DESIGN_OPTIONS.find((d) => d.key === answers.design);
  if (design && price(prices, design.key) > 0) {
    lines.push({ label: design.label, amount: price(prices, design.key) });
  }

  for (const e of EXTRAS) {
    if (answers.extras?.includes(e.key)) lines.push({ label: e.label, amount: price(prices, e.key) });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const upliftPct = answers.timeline ? price(prices, answers.timeline) : 0;
  const uplift = Math.round((subtotal * upliftPct) / 100);
  const total = subtotal + uplift;

  return {
    lines,
    subtotal,
    uplift,
    total,
    // Present a range rather than a hard price; rounded to the nearest £50.
    min: roundTo(total * 0.9, 5000),
    max: roundTo(total * 1.2, 5000),
    monthlyHosting: answers.hosting ? price(prices, HOSTING_KEY) : 0,
  };
}

export function labelFor(key: string): string {
  return PRICING_CATALOGUE.find((p) => p.key === key)?.label.replace(" (% uplift)", "") ?? key;
}
