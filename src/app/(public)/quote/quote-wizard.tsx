"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Button, Input, Label, Textarea, cn } from "@/components/ui";
import { formatGBP } from "@/lib/money";
import {
  BUDGETS,
  DESIGN_OPTIONS,
  EXTRAS,
  FEATURES,
  PROJECT_TYPES,
  TIMELINES,
  calculateEstimate,
  type PriceMap,
  type QuoteDraft,
} from "@/lib/pricing";
import { saveQuoteDraft, submitQuote } from "./actions";

const STEPS = ["Project type", "Pages & features", "Design & content", "Timeline & budget", "Your business", "Review"];

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
  const toggle = (key: "features" | "extras", value: string) =>
    setDraft((d) => {
      const list = (d[key] ?? []) as string[];
      return { ...d, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  function stepError(i: number): string | null {
    if (i === 0 && !draft.projectType) return "Choose a project type to continue.";
    if (i === 1 && (!draft.pages || draft.pages < 1)) return "Enter how many pages you need.";
    if (i === 3 && !draft.budget) return "Choose a budget range.";
    if (i === 4) {
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

  const type = PROJECT_TYPES.find((t) => t.key === draft.projectType);

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        {/* Stepper */}
        {/* Small screens: one line + progress bar instead of six wrapping pills */}
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
            <ChoiceGrid>
              {PROJECT_TYPES.map((t) => (
                <Choice
                  key={t.key}
                  type="radio"
                  name="projectType"
                  checked={draft.projectType === t.key}
                  onChange={() => update({ projectType: t.key, pages: Math.max(draft.pages ?? 1, t.includedPages) })}
                  title={t.label}
                  description={t.description}
                  meta={`From ${formatGBP(prices[t.key] ?? 0, { whole: true })}`}
                />
              ))}
            </ChoiceGrid>
          )}

          {step === 1 && (
            <div className="mt-6 space-y-8">
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
                {type && (
                  <p className="mt-1 text-xs text-ink-muted">
                    {type.includedPages} page{type.includedPages === 1 ? "" : "s"} included with a {type.label.toLowerCase()}.
                  </p>
                )}
              </div>
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Which features do you need?</legend>
                <ChoiceGrid className="mt-0">
                  {FEATURES.map((f) => (
                    <Choice
                      key={f.key}
                      type="checkbox"
                      name="features"
                      checked={draft.features?.includes(f.key) ?? false}
                      onChange={() => toggle("features", f.key)}
                      title={f.label}
                      meta={`+${formatGBP(prices[f.key] ?? 0, { whole: true })}`}
                    />
                  ))}
                </ChoiceGrid>
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-8">
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Design approach</legend>
                <ChoiceGrid className="mt-0">
                  {DESIGN_OPTIONS.map((d) => (
                    <Choice
                      key={d.key}
                      type="radio"
                      name="design"
                      checked={draft.design === d.key}
                      onChange={() => update({ design: d.key })}
                      title={d.label}
                      description={d.description}
                      meta={prices[d.key] ? `+${formatGBP(prices[d.key], { whole: true })}` : "Included"}
                    />
                  ))}
                </ChoiceGrid>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Do you need help with any of these?</legend>
                <ChoiceGrid className="mt-0">
                  {EXTRAS.map((e) => (
                    <Choice
                      key={e.key}
                      type="checkbox"
                      name="extras"
                      checked={draft.extras?.includes(e.key) ?? false}
                      onChange={() => toggle("extras", e.key)}
                      title={e.label}
                      meta={`+${formatGBP(prices[e.key] ?? 0, { whole: true })}`}
                    />
                  ))}
                </ChoiceGrid>
              </fieldset>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line/70 bg-ink/[0.015] p-4 transition-all duration-300 hover:border-brand-light/30 has-[:checked]:border-brand-light/50 has-[:checked]:bg-brand-strong/10">
                <input
                  type="checkbox"
                  className="mt-1 accent-[var(--brand-strong)]"
                  checked={draft.hosting ?? false}
                  onChange={(e) => update({ hosting: e.target.checked })}
                />
                <span>
                  <span className="block text-sm font-medium">Hosting & care plan</span>
                  <span className="text-sm text-ink-muted">
                    Managed hosting, security updates, backups and small changes:{" "}
                    {formatGBP(prices.hosting_monthly ?? 0, { whole: true })}/month.
                  </span>
                </span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 space-y-8">
              <fieldset>
                <legend className="mb-3 text-sm font-medium">When do you need it?</legend>
                <ChoiceGrid className="mt-0">
                  {TIMELINES.map((t) => (
                    <Choice
                      key={t.key}
                      type="radio"
                      name="timeline"
                      checked={draft.timeline === t.key}
                      onChange={() => update({ timeline: t.key })}
                      title={t.label}
                      description={t.description}
                      meta={prices[t.key] ? `+${prices[t.key]}%` : undefined}
                    />
                  ))}
                </ChoiceGrid>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-sm font-medium">What&apos;s your budget?</legend>
                <ChoiceGrid className="mt-0 sm:grid-cols-3">
                  {BUDGETS.map((b) => (
                    <Choice key={b} type="radio" name="budget" checked={draft.budget === b} onChange={() => update({ budget: b })} title={b} />
                  ))}
                </ChoiceGrid>
              </fieldset>
            </div>
          )}

          {step === 4 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="businessName">Business name *</Label>
                <Input id="businessName" value={draft.businessName ?? ""} onChange={(e) => update({ businessName: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" placeholder="e.g. Fitness, Legal, Hospitality" value={draft.industry ?? ""} onChange={(e) => update({ industry: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="existingSite">Current website (if any)</Label>
                <Input id="existingSite" placeholder="https://" value={draft.existingSite ?? ""} onChange={(e) => update({ existingSite: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="goals">What do you want the website to achieve? *</Label>
                <Textarea
                  id="goals"
                  placeholder="e.g. Get more bookings, sell online, look more professional than competitors…"
                  value={draft.goals ?? ""}
                  onChange={(e) => update({ goals: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Anything else we should know?</Label>
                <Textarea id="notes" value={draft.notes ?? ""} onChange={(e) => update({ notes: e.target.value })} />
              </div>
            </div>
          )}

          {step === 5 && (
            <dl className="mt-6 divide-y divide-line text-sm">
              <ReviewRow label="Project type">{type?.label ?? "—"}</ReviewRow>
              <ReviewRow label="Pages">{draft.pages}</ReviewRow>
              <ReviewRow label="Features">
                {draft.features?.length ? draft.features.map((k) => FEATURES.find((f) => f.key === k)?.label).join(", ") : "None"}
              </ReviewRow>
              <ReviewRow label="Design">{DESIGN_OPTIONS.find((d) => d.key === draft.design)?.label}</ReviewRow>
              <ReviewRow label="Extras">
                {draft.extras?.length ? draft.extras.map((k) => EXTRAS.find((e) => e.key === k)?.label).join(", ") : "None"}
              </ReviewRow>
              <ReviewRow label="Hosting & care">{draft.hosting ? "Yes" : "No"}</ReviewRow>
              <ReviewRow label="Timeline">{TIMELINES.find((t) => t.key === draft.timeline)?.label}</ReviewRow>
              <ReviewRow label="Budget">{draft.budget}</ReviewRow>
              <ReviewRow label="Business">{draft.businessName}</ReviewRow>
              <ReviewRow label="Goals">{draft.goals}</ReviewRow>
            </dl>
          )}

          {error && (
            <p role="alert" className="mt-6 rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-6">
            <Button type="button" variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              ← Back
            </Button>
            <span className={cn("text-xs", saveState === "error" ? "text-danger" : "text-ink-muted")} aria-live="polite">
              {saveState === "saving" && "Saving…"}
              {saveState === "saved" && "Progress saved"}
              {saveState === "error" && "Couldn't save. Check your connection."}
            </span>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => go(step + 1)}>
                Continue →
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={submitting}>
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
          <p key={estimate.total} className="mt-3 animate-[fade-in_0.5s_ease] font-display text-4xl font-semibold tracking-tight">
            {estimate.total > 0
              ? `${formatGBP(estimate.min, { whole: true })} – ${formatGBP(estimate.max, { whole: true })}`
              : "£—"}
          </p>
          {estimate.monthlyHosting > 0 && (
            <p className="mt-1 text-sm text-white/70">+ {formatGBP(estimate.monthlyHosting, { whole: true })}/month hosting & care</p>
          )}
          {estimate.lines.length > 0 && (
            <ul className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
              {estimate.lines.map((l) => (
                <li key={l.label} className="flex justify-between gap-4">
                  <span className="text-white/70">{l.label}</span>
                  <span>{formatGBP(l.amount, { whole: true })}</span>
                </li>
              ))}
              {estimate.uplift > 0 && (
                <li className="flex justify-between gap-4">
                  <span className="text-white/70">Rush delivery</span>
                  <span>{formatGBP(estimate.uplift, { whole: true })}</span>
                </li>
              )}
            </ul>
          )}
          <p className="mt-6 text-xs text-white/50">
            This is a guide, not a fixed price. We&apos;ll confirm a tailored quote after reviewing your requirements.
          </p>
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
