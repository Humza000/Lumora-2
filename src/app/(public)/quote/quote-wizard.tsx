"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Button, Input, Label, Textarea, cn } from "@/components/ui";
import { formatGBP } from "@/lib/money";
import {
  FEATURES_BY_TYPE,
  HOSTING_PLANS,
  PROJECT_TYPES,
  calculateEstimate,
  featureLabel,
  featuresForType,
  type PriceMap,
  type QuoteDraft,
} from "@/lib/pricing";
import { saveQuoteDraft, submitQuote } from "./actions";

const STEPS = ["Project type", "Pages & features", "Hosting & care", "Your business", "Review"];

const DISCLAIMER =
  "This is an indicative estimate. We'll review your requirements and confirm the final price before any work begins.";

type Props = { initialDraft: QuoteDraft; initialQuoteId: string | null; prices: PriceMap };

export function QuoteWizard({ initialDraft, initialQuoteId, prices }: Props) {
  const [draft, setDraft] = useState<QuoteDraft>(initialDraft);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(initialQuoteId ? "saved" : "idle");
  const [submitting, startSubmitting] = useTransition();

  // Autosave: debounced on every change, run one at a time so the first save's draft id is
  // reused by the next (never two drafts), and stopped once the quote is being submitted.
  const quoteId = useRef(initialQuoteId);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const submitted = useRef(false);
  const untouched = useRef(true);

  const save = useCallback((d: QuoteDraft) => {
    saveQueue.current = saveQueue.current.then(async () => {
      if (submitted.current) return;
      setSaveState("saving");
      try {
        const res = await saveQuoteDraft(quoteId.current, d);
        if (res.quoteId) quoteId.current = res.quoteId;
        setSaveState(res.quoteId ? "saved" : "idle");
      } catch {
        setSaveState("error");
      }
    });
    return saveQueue.current;
  }, []);

  useEffect(() => {
    if (untouched.current) {
      untouched.current = false;
      return;
    }
    const t = setTimeout(() => save(draft), 900);
    return () => clearTimeout(t);
  }, [draft, save]);

  const estimate = useMemo(() => calculateEstimate(draft, prices), [draft, prices]);
  const update = (patch: Partial<QuoteDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleFeature = (value: string) =>
    setDraft((d) => {
      const list = d.features ?? [];
      return { ...d, features: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  function chooseType(key: (typeof PROJECT_TYPES)[number]["key"]) {
    const t = PROJECT_TYPES.find((p) => p.key === key)!;
    setDraft((d) => ({
      ...d,
      projectType: key,
      // A landing page is one page; other types start from their typical size.
      pages: key === "type_landing" ? 1 : Math.max(d.projectType === "type_landing" ? 0 : (d.pages ?? 0), t.includedPages),
      // Options differ per project type: keep only those that still apply.
      features: featuresForType(key, d.features),
    }));
  }

  function stepError(i: number): string | null {
    if (i === 0 && !draft.projectType) return "Choose a project type to continue.";
    if (i === 1 && (!draft.pages || draft.pages < 1)) return "Enter how many pages you need.";
    if (i === 2 && !draft.hostingPlan) return "Choose a hosting option, or “No hosting required”.";
    if (i === 3) {
      if (!draft.businessName?.trim()) return "Tell us your business name.";
      if ((draft.goals?.trim().length ?? 0) < 10) return "Tell us a little about your goals (10+ characters).";
    }
    return null;
  }

  function go(to: number) {
    if (to > step) {
      const err = stepError(step);
      if (err) return setError(err);
    }
    setError(null);
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const err = stepError(i);
      if (err) {
        setStep(i);
        return setError(err);
      }
    }
    setError(null);
    startSubmitting(async () => {
      submitted.current = true; // no more autosaves from here
      await saveQueue.current;
      try {
        const res = await submitQuote(quoteId.current, draft);
        if (res?.error) {
          submitted.current = false;
          setError(res.error);
        }
      } catch {
        submitted.current = false;
        setError("We couldn't submit your quote. Check your connection and try again.");
      }
    });
  }

  const type = estimate.projectType;
  const typeFeatures = type ? FEATURES_BY_TYPE[type.key] : [];
  const selectedFeatures = featuresForType(draft.projectType, draft.features);
  const monthlyText = estimate.hostingPlan
    ? estimate.monthlyHosting > 0
      ? `${formatGBP(estimate.monthlyHosting, { whole: true })}/month`
      : "No monthly charge"
    : "Not chosen yet";

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        {/* Small screens: one line + progress bar instead of wrapping pills */}
        <div className="mb-6 sm:hidden">
          <p className="text-sm font-medium">
            Step {step + 1} of {STEPS.length} <span className="font-normal text-ink-muted">· {STEPS[step]}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]" aria-hidden>
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
        <ol className="mb-8 hidden flex-wrap gap-2 sm:flex" aria-label="Quote steps">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => (i < step ? go(i) : undefined)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300",
                  i === step &&
                    "border-transparent bg-gradient-to-r from-brand to-brand-strong text-on-brand shadow-[0_0_20px_-2px_color-mix(in_oklab,var(--brand)_70%,transparent)]",
                  i < step && "border-brand-light/30 bg-brand-strong/15 text-brand-light hover:bg-brand-strong/25",
                  i > step && "border-line/70 bg-ink/[0.015] text-ink-muted",
                )}
              >
                {i + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

        <div className="ring-gradient rounded-3xl border border-line/60 bg-surface/80 p-6 shadow-[0_30px_80px_-40px_color-mix(in_oklab,var(--brand)_50%,transparent)] md:p-9">
          <h2 className="font-display text-3xl font-semibold">{STEPS[step]}</h2>

          {step === 0 && (
            <>
              <p className="mt-2 text-sm text-ink-muted">Pick the closest match. Prices shown are starting prices.</p>
              <ChoiceGrid>
                {PROJECT_TYPES.map((t) => (
                  <Choice
                    key={t.key}
                    type="radio"
                    name="projectType"
                    checked={draft.projectType === t.key}
                    onChange={() => chooseType(t.key)}
                    title={t.label}
                    description={t.description}
                    meta={`From ${formatGBP(prices[t.priceKey] ?? 0, { whole: true })}`}
                  />
                ))}
              </ChoiceGrid>
            </>
          )}

          {step === 1 && type && (
            <div className="mt-6 space-y-8">
              {type.key !== "type_landing" && (
                <div className="max-w-xs">
                  <Label htmlFor="pages">How many pages?</Label>
                  <Input
                    id="pages"
                    type="number"
                    min={1}
                    max={100}
                    value={draft.pages ?? ""}
                    onChange={(e) => update({ pages: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                  <p className="mt-1 text-xs text-ink-muted">A rough number is fine, e.g. Home, About, Services, Contact.</p>
                </div>
              )}
              <fieldset>
                <legend className="text-sm font-medium">What would you like your {type.label.toLowerCase()} to include?</legend>
                <p className="mt-1 mb-3 text-sm text-ink-muted">
                  Tick everything that applies. This helps us understand your project; it doesn&apos;t add to the price.
                </p>
                <ChoiceGrid className="mt-0">
                  {typeFeatures.map((f) => (
                    <Choice
                      key={f.key}
                      type="checkbox"
                      name="features"
                      checked={draft.features?.includes(f.key) ?? false}
                      onChange={() => toggleFeature(f.key)}
                      title={f.label}
                    />
                  ))}
                </ChoiceGrid>
              </fieldset>
              <div>
                <Label htmlFor="featuresOther">Anything else you need?</Label>
                <Textarea
                  id="featuresOther"
                  placeholder="e.g. live chat, a members-only area, connecting to your booking or stock system…"
                  value={draft.featuresOther ?? ""}
                  onChange={(e) => update({ featuresOther: e.target.value })}
                />
                <p className="mt-1 text-xs text-ink-muted">Complex functionality may require an individually tailored quote.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6">
              <p className="rounded-2xl border border-brand-light/20 bg-brand-soft/60 px-4 py-3 text-sm text-ink">
                Hosting & care plans are <strong>optional monthly payments</strong>, separate from the one-time price of
                building your website.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Hosting & care plan">
                {HOSTING_PLANS.map((plan) => {
                  const checked = draft.hostingPlan === plan.key;
                  const monthly = prices[plan.key] ?? 0;
                  return (
                    <label
                      key={plan.key}
                      className={cn(
                        "group relative flex cursor-pointer flex-col rounded-2xl border p-5 transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-light",
                        checked
                          ? "border-brand-light/60 bg-brand-strong/10 shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand-tint)_35%,transparent),0_12px_40px_-12px_color-mix(in_oklab,var(--brand)_70%,transparent)]"
                          : "border-line/70 bg-ink/[0.015] hover:-translate-y-0.5 hover:border-brand-light/30 hover:bg-ink/[0.035]",
                      )}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="hostingPlan"
                            checked={checked}
                            onChange={() => update({ hostingPlan: plan.key })}
                            className="accent-[var(--brand-strong)]"
                          />
                          <span className="font-medium">{plan.label}</span>
                        </span>
                        <span className="text-right whitespace-nowrap">
                          <span className="font-display text-2xl font-semibold">{formatGBP(monthly, { whole: true })}</span>
                          <span className="text-xs text-ink-muted">/month</span>
                        </span>
                      </span>
                      <span className="mt-1 pl-6 text-sm text-ink-muted">{plan.description}</span>
                      <ul className="mt-3 space-y-1.5 border-t border-line/70 pt-3 pl-6 text-sm">
                        {plan.includes.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-brand-light" aria-hidden>
                              ✓
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="businessName">Business name *</Label>
                <Input
                  id="businessName"
                  placeholder="e.g. Northline Plumbing"
                  value={draft.businessName ?? ""}
                  onChange={(e) => update({ businessName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g. Hair salon, plumbing, fitness coaching"
                  value={draft.industry ?? ""}
                  onChange={(e) => update({ industry: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="existingSite">Current website (if any)</Label>
                <Input
                  id="existingSite"
                  placeholder="e.g. www.yourbusiness.co.uk (leave blank if you don't have one)"
                  value={draft.existingSite ?? ""}
                  onChange={(e) => update({ existingSite: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="goals">What do you want the website to achieve? *</Label>
                <Textarea
                  id="goals"
                  placeholder="e.g. Get more bookings, start selling online, look more professional than competitors…"
                  value={draft.goals ?? ""}
                  onChange={(e) => update({ goals: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Anything else we should know?</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. a deadline, websites you like, branding or photos you already have…"
                  value={draft.notes ?? ""}
                  onChange={(e) => update({ notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-6 space-y-8">
              <dl className="divide-y divide-line text-sm">
                <ReviewRow label="Project type">{type?.label ?? "—"}</ReviewRow>
                <ReviewRow label="Starting website price">
                  {type ? `From ${formatGBP(estimate.oneTime, { whole: true })}` : "—"}
                </ReviewRow>
                {type?.key !== "type_landing" && <ReviewRow label="Pages">{draft.pages}</ReviewRow>}
                <ReviewRow label="Features">
                  {selectedFeatures.length ? selectedFeatures.map(featureLabel).join(", ") : "None selected"}
                </ReviewRow>
                <ReviewRow label="Additional requirements">{draft.featuresOther?.trim() || "None"}</ReviewRow>
                <ReviewRow label="Hosting & care">
                  {estimate.hostingPlan ? `${estimate.hostingPlan.label} · ${monthlyText}` : "—"}
                </ReviewRow>
                <ReviewRow label="Business">{draft.businessName}</ReviewRow>
                <ReviewRow label="Industry">{draft.industry?.trim() || "—"}</ReviewRow>
                <ReviewRow label="Current website">{draft.existingSite?.trim() || "—"}</ReviewRow>
                <ReviewRow label="Goals">{draft.goals}</ReviewRow>
                <ReviewRow label="Anything else">{draft.notes?.trim() || "—"}</ReviewRow>
              </dl>

              <div className="grid gap-3 sm:grid-cols-2">
                <Total label="One-time development cost" value={type ? `From ${formatGBP(estimate.oneTime, { whole: true })}` : "—"}>
                  Your {type?.label.toLowerCase() ?? "website"} package, paid once.
                </Total>
                <Total label="Monthly hosting cost" value={monthlyText}>
                  {estimate.hostingPlan?.label ?? "Hosting & care"}. Optional and separate from the build.
                </Total>
              </div>

              {estimate.customQuote && (
                <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                  Your requirements may need a custom quote. We&apos;ll confirm the price once we&apos;ve reviewed them.
                </p>
              )}
              <p className="text-sm text-ink-muted">{DISCLAIMER}</p>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-6 rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-6">
            <Button type="button" variant="ghost" className="whitespace-nowrap" onClick={() => go(step - 1)} disabled={step === 0}>
              ← Back
            </Button>
            <span className={cn("text-xs", saveState === "error" ? "text-danger" : "text-ink-muted")} aria-live="polite">
              {saveState === "saving" && "Saving…"}
              {saveState === "saved" && "Progress saved"}
              {saveState === "error" && "Couldn't save. Check your connection."}
            </span>
            {step < STEPS.length - 1 ? (
              <Button type="button" className="whitespace-nowrap" onClick={() => go(step + 1)}>
                Continue →
              </Button>
            ) : (
              <Button type="button" className="whitespace-nowrap" onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit quote request"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Live estimate */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="ring-gradient relative isolate overflow-hidden rounded-3xl border border-brand-light/20 bg-gradient-to-br from-brand-deep to-ink p-7 text-white shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--brand)_75%,transparent)]">
          <div className="absolute -top-20 -right-20 -z-10 h-56 w-56 rounded-full bg-brand-strong/40 blur-[80px]" aria-hidden />
          <p className="text-xs tracking-[0.2em] text-brand-tint uppercase">Indicative estimate</p>

          <p className="mt-5 text-sm text-white/70">One-time development</p>
          <p key={estimate.oneTime} className="mt-1 animate-[fade-in_0.5s_ease] font-display text-4xl font-semibold tracking-tight">
            {type ? `From ${formatGBP(estimate.oneTime, { whole: true })}` : "£—"}
          </p>
          {type && <p className="mt-1 text-sm text-white/70">{type.label}</p>}

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm text-white/70">Monthly hosting & care</p>
            <p className="mt-1 text-xl font-semibold">{monthlyText}</p>
            {estimate.hostingPlan && <p className="text-sm text-white/70">{estimate.hostingPlan.label}</p>}
          </div>

          {estimate.customQuote && (
            <p className="mt-5 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/85">Your requirements may need a custom quote.</p>
          )}
          <p className="mt-6 text-xs text-white/50">{DISCLAIMER}</p>
        </div>
      </aside>
    </div>
  );
}

function ChoiceGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-6 grid gap-3 sm:grid-cols-2", className)}>{children}</div>;
}

function Choice({
  type,
  name,
  checked,
  onChange,
  title,
  description,
  meta,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
  meta?: string;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-light",
        checked
          ? "border-brand-light/60 bg-brand-strong/15 shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand-tint)_35%,transparent),0_12px_40px_-12px_color-mix(in_oklab,var(--brand)_70%,transparent)]"
          : "border-line/70 bg-ink/[0.015] hover:-translate-y-0.5 hover:border-brand-light/30 hover:bg-ink/[0.035] hover:shadow-[0_12px_30px_-15px_color-mix(in_oklab,var(--brand)_60%,transparent)]",
      )}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="mt-1 accent-[var(--brand-strong)]" />
      <span className="flex-1">
        <span className="flex justify-between gap-2">
          <span className="text-sm font-medium">{title}</span>
          {meta && (
            <span className={cn("text-xs whitespace-nowrap transition-colors", checked ? "text-brand-light" : "text-ink-muted")}>{meta}</span>
          )}
        </span>
        {description && <span className="mt-1 block text-sm text-ink-muted">{description}</span>}
      </span>
    </label>
  );
}

function ReviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="col-span-2 whitespace-pre-line">{children}</dd>
    </div>
  );
}

function Total({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-light/25 bg-brand-soft/50 p-5">
      <p className="text-xs font-medium tracking-[0.12em] text-brand-light uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-ink-muted">{children}</p>
    </div>
  );
}
