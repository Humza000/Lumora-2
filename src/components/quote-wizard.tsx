"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Honeypot, ActionForm, SubmitButton, TextField } from "@/components/forms";
import { markTabSignedIn } from "@/components/tab-session";
import { Button, Input, Label, Textarea, cn } from "@/components/ui";
import { formatGBP } from "@/lib/money";
import {
  FEATURES_BY_TYPE,
  HOSTING_BILLING,
  HOSTING_PLANS,
  PROJECT_TYPES,
  calculateEstimate,
  featureLabel,
  featuresForType,
  formatHosting,
  hostingPrices,
  partialDraft,
  type PriceMap,
  type QuoteDraft,
} from "@/lib/pricing";
import { signupAndSubmitQuote } from "@/app/(public)/quote/actions";
import { requestQuoteChanges, saveQuoteDraft, submitQuote } from "@/app/portal/quote/actions";

const STEPS = ["Project type", "Pages & features", "Hosting & care", "Your business", "Review"];

const DISCLAIMER =
  "This is an indicative estimate. We'll review your requirements and confirm the final price before any work begins.";

/** Where a guest's answers are kept until they create an account (or log in) on the last step. */
const GUEST_DRAFT_KEY = "lumora:quote-draft";

function readGuestDraft(): QuoteDraft | null {
  try {
    const raw = localStorage.getItem(GUEST_DRAFT_KEY);
    return raw ? partialDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeGuestDraft(draft: QuoteDraft | null) {
  try {
    if (draft) localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(GUEST_DRAFT_KEY);
  } catch {
    // Storage blocked: answers just aren't kept across reloads.
  }
}

/** On the thanks page: the guest's answers have been sent, so forget the local copy. */
export function ClearGuestDraft() {
  useEffect(() => writeGuestDraft(null), []);
  return null;
}

type Props = {
  /** `guest`: answers are kept on the device and the last step creates the account. */
  mode?: "guest" | "client";
  initialDraft: QuoteDraft;
  initialQuoteId: string | null;
  prices: PriceMap;
  /** Set when the client is editing a quote we sent them: nothing is saved until they send the changes. */
  changesFor?: string;
};

export function QuoteWizard({ mode = "client", initialDraft, initialQuoteId, prices, changesFor }: Props) {
  const guest = mode === "guest";
  const [changeNote, setChangeNote] = useState("");
  const [draft, setDraft] = useState<QuoteDraft>(initialDraft);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(initialQuoteId && !changesFor ? "saved" : "idle");
  const [submitting, startSubmitting] = useTransition();

  // Autosave: debounced on every change, run one at a time so the first save's draft id is
  // reused by the next (never two drafts), and stopped once the quote is being submitted.
  const quoteId = useRef(initialQuoteId);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const submitted = useRef(false);
  const untouched = useRef(true);

  // Restore a guest's answers: on the guest wizard after a reload, or in the portal right after
  // they chose "Log in" on the guest wizard's last step (then saved to their account as usual).
  useEffect(() => {
    if (changesFor) return;
    const local = readGuestDraft();
    if (!local) return;
    // One-off read of device storage after hydration (the guest page is pre-built, so it can't be read while rendering).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft((d) => ({ ...d, ...local, features: featuresForType(local.projectType, local.features) }));
    if (!guest) writeGuestDraft(null);
  }, [guest, changesFor]);

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
    if (changesFor) return; // editing a sent quote: only saved when they send the changes
    if (guest) return writeGuestDraft(draft); // cheap, so no debounce: nothing is lost if they leave straight away
    const t = setTimeout(() => save(draft), 900);
    return () => clearTimeout(t);
  }, [draft, save, changesFor, guest]);

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
    if (changesFor && changeNote.trim().length < 3) return setError("Tell us what you'd like changed, so we know what to look at.");
    setError(null);
    startSubmitting(async () => {
      submitted.current = true; // no more autosaves from here
      await saveQueue.current;
      try {
        const res = changesFor ? await requestQuoteChanges(changesFor, draft, changeNote) : await submitQuote(quoteId.current, draft);
        if (res?.error) {
          submitted.current = false;
          setError(res.error);
        }
      } catch {
        submitted.current = false;
        setError(changesFor ? "We couldn't send your changes. Check your connection and try again." : "We couldn't submit your quote. Check your connection and try again.");
      }
    });
  }

  const type = estimate.projectType;
  const typeFeatures = type ? FEATURES_BY_TYPE[type.key] : [];
  const selectedFeatures = featuresForType(draft.projectType, draft.features);
  const hostingText = formatHosting(estimate);
  const yearly = estimate.hostingBilling === "yearly";
  // Biggest yearly saving across plans, for the "Yearly" toggle label.
  const maxSaving = Math.max(...HOSTING_PLANS.map((p) => hostingPrices(p.key, prices).yearlySaving));

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
                Hosting & care plans are <strong>optional recurring payments</strong>, billed monthly or yearly, and separate
                from the one-time price of building your website. Paying yearly costs less. Cancel anytime.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-line bg-surface-2/70 p-1" role="radiogroup" aria-label="Billing">
                  {HOSTING_BILLING.map((b) => {
                    const active = estimate.hostingBilling === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => update({ hostingBilling: b })}
                        className={cn(
                          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
                          active ? "bg-brand text-on-brand shadow-sm" : "text-ink-muted hover:text-ink",
                        )}
                      >
                        {b === "monthly" ? "Monthly" : "Yearly"}
                      </button>
                    );
                  })}
                </div>
                {maxSaving > 0 && (
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    Pay yearly and save up to {formatGBP(maxSaving, { whole: true })} a year
                  </span>
                )}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Hosting & care plan">
                {HOSTING_PLANS.map((plan) => {
                  const checked = draft.hostingPlan === plan.key;
                  const p = hostingPrices(plan.key, prices);
                  const showYearly = yearly && p.monthly > 0;
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
                          <span className="font-display text-2xl font-semibold">
                            {formatGBP(showYearly ? p.yearly : p.monthly, { whole: true })}
                          </span>
                          <span className="text-xs text-ink-muted">/{showYearly ? "year" : "month"}</span>
                        </span>
                      </span>
                      <span className="mt-1 pl-6 text-sm text-ink-muted">{plan.description}</span>
                      {showYearly && p.yearlySaving > 0 && (
                        <span className="mt-1 pl-6 text-xs font-medium text-success">
                          Save {formatGBP(p.yearlySaving, { whole: true })} vs {formatGBP(p.monthly, { whole: true })}/month
                        </span>
                      )}
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
                  {estimate.hostingPlan ? `${estimate.hostingPlan.label} · ${hostingText}${estimate.hostingPrice > 0 ? ` (billed ${estimate.hostingBilling})` : ""}` : "—"}
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
                <Total label={yearly && estimate.hostingPrice > 0 ? "Yearly hosting cost" : "Monthly hosting cost"} value={hostingText}>
                  {estimate.hostingPlan?.label ?? "Hosting & care"}. Optional and separate from the build.
                  {estimate.hostingSaving > 0 && ` Saves ${formatGBP(estimate.hostingSaving, { whole: true })} a year.`}
                </Total>
              </div>

              {estimate.customQuote && (
                <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                  Your requirements may need a custom quote. We&apos;ll confirm the price once we&apos;ve reviewed them.
                </p>
              )}
              {changesFor ? (
                <div>
                  <Label htmlFor="changeNote">What would you like changed?</Label>
                  <Textarea
                    id="changeNote"
                    rows={4}
                    maxLength={2000}
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="e.g. I'd like yearly hosting instead, and can we add a booking form?"
                  />
                  <p className="mt-1 text-xs text-ink-muted">
                    We&apos;ll review your changes and send you an updated quote. Nothing is agreed or billed until you accept it.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">{DISCLAIMER}</p>
              )}
              {guest && <GuestSignup draft={draft} />}
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
              {guest ? draft !== initialDraft && "Saved on this device" : saveState === "saved" && "Progress saved"}
              {saveState === "error" && "Couldn't save. Check your connection."}
            </span>
            {step < STEPS.length - 1 ? (
              <Button type="button" className="whitespace-nowrap" onClick={() => go(step + 1)}>
                Continue →
              </Button>
            ) : guest ? (
              <span aria-hidden />
            ) : (
              <Button type="button" className="whitespace-nowrap" onClick={submit} disabled={submitting}>
                {changesFor ? (submitting ? "Sending…" : "Send changes for review") : submitting ? "Submitting…" : "Submit quote request"}
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
          <p key={estimate.oneTime} className="relative mt-1 animate-[fade-in_0.5s_ease] font-display text-4xl font-semibold tracking-tight">
            {type ? `From ${formatGBP(estimate.oneTime, { whole: true })}` : "£—"}
          </p>
          {type && <p className="mt-1 text-sm text-white/70">{type.label}</p>}

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm text-white/70">{yearly && estimate.hostingPrice > 0 ? "Yearly" : "Monthly"} hosting & care</p>
            <p className="mt-1 text-xl font-semibold">{hostingText}</p>
            {estimate.hostingSaving > 0 && (
              <p className="text-sm text-brand-tint">You save {formatGBP(estimate.hostingSaving, { whole: true })} a year</p>
            )}
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

/** Last step of the guest wizard: create the account and send the quote in one go. */
function GuestSignup({ draft }: { draft: QuoteDraft }) {
  return (
    // Creating the account signs this tab in (see components/tab-session.tsx).
    <div onSubmit={markTabSignedIn} className="rounded-2xl border border-line bg-surface-2/60 p-5 md:p-6">
      <h3 className="font-display text-2xl font-semibold">Create your account to send your quote</h3>
      <p className="mt-1 mb-5 text-sm text-ink-muted">
        You&apos;ll use it to see our proposal, accept it and follow your project once we start.
      </p>
      <ActionForm action={signupAndSubmitQuote}>
        <Honeypot />
        <input type="hidden" name="answers" value={JSON.stringify(draft)} />
        <TextField label="Your name" name="name" autoComplete="name" required />
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters, including a letter and a number."
          required
        />
        <SubmitButton className="w-full" pendingText="Sending your quote…">
          Create account &amp; send quote
        </SubmitButton>
      </ActionForm>
      <p className="mt-4 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login?next=%2Fportal%2Fquote" className="font-medium text-brand-light hover:underline">
          Log in
        </Link>{" "}
        and your answers come with you.
      </p>
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
