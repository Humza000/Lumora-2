import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/forms";
import { ButtonLink, Card, EmptyState, PageHeader, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { awaitingFirstPayment, firstCharge, hostingBillingState, type HostingBillingState } from "@/lib/hosting";
import { formatGBP } from "@/lib/money";
import { planStartPrices } from "@/lib/hosting-start";
import { cancelPlan, keepPlan, manageCard, setUpAutomaticPayments, startPlan } from "./actions";

export const metadata = { title: "Hosting" };

const STATE: Record<HostingBillingState, { label: string; tone: string }> = {
  manual: { label: "Paid by invoice", tone: "border-line bg-ink/5 text-ink-muted" },
  active: { label: "Automatic payments on", tone: "border-success/25 bg-success/10 text-success" },
  past_due: { label: "Payment failed", tone: "border-danger/25 bg-danger/10 text-danger" },
  cancelling: { label: "Cancelled, ends soon", tone: "border-warning/25 bg-warning/10 text-warning" },
  cancelled: { label: "Ended", tone: "border-line bg-ink/5 text-ink-muted" },
};

export default async function PortalHosting({ searchParams }: PageProps<"/portal/hosting">) {
  const user = await requireClient();
  const { subscribed, cancelled, kept, confirm } = await searchParams;
  const rows = await db.hostingPlan.findMany({
    where: { clientId: user.id },
    include: { _count: { select: { invoices: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  // Plans created at launch wait for a first card payment; the client picks monthly or yearly.
  const plans = await Promise.all(
    rows.map(async (plan) => ({ ...plan, start: awaitingFirstPayment(plan, plan._count.invoices) ? await planStartPrices(plan) : null })),
  );

  return (
    <>
      <PageHeader title="Hosting & care" description="Your plans, payments and renewal dates." />
      {subscribed && (
        <p role="status" className="mb-6 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          You&apos;re all set. Payments will now be taken automatically; we&apos;ll email a receipt each time.
        </p>
      )}
      {cancelled && (
        <p role="status" className="mb-6 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          Your plan has been cancelled. You won&apos;t be charged again, and we&apos;ve emailed you a confirmation.
        </p>
      )}

      {kept && (
        <p role="status" className="mb-6 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          Great, your plan will carry on as normal.
        </p>
      )}

      {plans.length === 0 ? (
        <EmptyState title="No hosting plans" description="If we host or look after your website, your plan will appear here." />
      ) : (
        <div className="space-y-5">
          {plans.map((plan) => {
            const state = hostingBillingState(plan);
            const per = plan.interval === "ANNUAL" ? "year" : "month";
            const timing = firstCharge(plan.renewalDate);
            const confirming = confirm === plan.id && (state === "active" || state === "past_due" || state === "manual");
            return (
              <Card key={plan.id} data-plan={plan.domain}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{plan.planName}</h2>
                    <p className="text-sm text-ink-muted">{plan.domain}</p>
                  </div>
                  {plan.start ? (
                    <span className="rounded-full border border-warning/25 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">Ready to start</span>
                  ) : (
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATE[state].tone}`}>{STATE[state].label}</span>
                  )}
                </div>

                {plan.start && (
                  <div className="mt-5 border-t border-line pt-5 text-sm">
                    <p className="font-medium">Your site is live. Start your plan</p>
                    <p className="mt-1 max-w-xl text-ink-muted">
                      Choose how you&apos;d like to pay and make your first payment by card. Your card is saved securely by Stripe and the plan
                      renews automatically, so there are no invoices to pay by hand. You can cancel any time.
                    </p>
                    <ActionForm action={startPlan.bind(null, plan.id)} className="mt-4">
                      <fieldset className="grid gap-2 sm:grid-cols-2">
                        <legend className="sr-only">Billing period</legend>
                        {(["MONTHLY", "ANNUAL"] as const).map((interval) =>
                          plan.start![interval] ? (
                            <label key={interval} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2 p-3 has-checked:border-brand has-checked:bg-brand-soft">
                              <input type="radio" name="interval" value={interval} defaultChecked={plan.interval === interval} className="mt-1 accent-[var(--brand-strong)]" />
                              <span>
                                <span className="font-medium">
                                  {interval === "MONTHLY" ? "Monthly" : "Yearly"}: {formatGBP(plan.start![interval])}/{interval === "MONTHLY" ? "month" : "year"}
                                </span>
                                <span className="block text-xs text-ink-muted">
                                  {interval === "MONTHLY"
                                    ? "Paid today, then every month."
                                    : plan.start!.MONTHLY * 12 > plan.start!.ANNUAL
                                      ? `Paid today, then every year. Saves ${formatGBP(plan.start!.MONTHLY * 12 - plan.start!.ANNUAL)} a year.`
                                      : "Paid today, then every year."}
                                </span>
                              </span>
                            </label>
                          ) : null,
                        )}
                      </fieldset>
                      <SubmitButton pendingText="Opening secure checkout…">Pay first payment & save card</SubmitButton>
                    </ActionForm>
                  </div>
                )}

                {!plan.start && (
                <>
                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-ink-muted">Price</dt>
                    <dd className="mt-0.5 font-medium">
                      {formatGBP(plan.price)}/{per}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">{state === "cancelling" || state === "cancelled" ? "Ends" : "Next payment"}</dt>
                    <dd className="mt-0.5 font-medium">{formatDate(plan.cancelAt ?? plan.renewalDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Includes</dt>
                    <dd className="mt-0.5 font-medium">{plan.includesMaintenance ? "Hosting, SSL & maintenance" : "Hosting & SSL"}</dd>
                  </div>
                </dl>

                <div className="mt-6 border-t border-line pt-5 text-sm">
                  {state === "manual" && !confirming && (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="max-w-md text-ink-muted">
                        Pay automatically by card instead of paying an invoice each {per}.{" "}
                        {timing.kind === "on"
                          ? `Your current ${per} is paid, so your first card payment is on ${formatDate(timing.at)}.`
                          : `You'll pay ${formatGBP(plan.price)} today, then every ${per}.`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <ActionForm action={setUpAutomaticPayments.bind(null, plan.id)} className="space-y-2">
                          <SubmitButton pendingText="Opening secure checkout…">Set up automatic payments</SubmitButton>
                        </ActionForm>
                        <ButtonLink href={`/portal/hosting?confirm=${plan.id}`} variant="ghost">
                          Cancel plan
                        </ButtonLink>
                      </div>
                    </div>
                  )}

                  {(state === "active" || state === "past_due") && !confirming && (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="max-w-md text-ink-muted">
                        {state === "past_due"
                          ? "Your last payment didn't go through. Please update your card; we'll retry automatically."
                          : `${formatGBP(plan.price)} is taken automatically every ${per}. You can cancel at any time.`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <ActionForm action={manageCard.bind(null, plan.id)} className="space-y-2">
                          <SubmitButton variant={state === "past_due" ? "primary" : "secondary"} pendingText="Opening…">
                            Update card & receipts
                          </SubmitButton>
                        </ActionForm>
                        <ButtonLink href={`/portal/hosting?confirm=${plan.id}`} variant="ghost">
                          Cancel plan
                        </ButtonLink>
                      </div>
                    </div>
                  )}

                  {confirming && (
                    <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
                      <p className="font-medium">Cancel your {plan.planName} plan?</p>
                      <p className="mt-1 text-ink-muted">
                        You won&apos;t be charged again. Hosting and care continue until {formatDate(plan.renewalDate)}, the end of the{" "}
                        {per} you&apos;ve paid for, and then stop. Make sure you&apos;ve arranged other hosting before then.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <ActionForm action={cancelPlan.bind(null, plan.id)} className="space-y-2">
                          <SubmitButton variant="danger" pendingText="Cancelling…">
                            Yes, cancel my plan
                          </SubmitButton>
                        </ActionForm>
                        <ButtonLink href="/portal/hosting" variant="secondary">
                          Keep my plan
                        </ButtonLink>
                      </div>
                    </div>
                  )}

                  {state === "cancelling" && (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="max-w-md text-ink-muted">
                        Cancelled. You won&apos;t be charged again, and hosting continues until {formatDate(plan.cancelAt)}.
                      </p>
                      <ActionForm action={keepPlan.bind(null, plan.id)} className="space-y-2">
                        <SubmitButton variant="secondary" pendingText="Restarting…">
                          Keep my plan after all
                        </SubmitButton>
                      </ActionForm>
                    </div>
                  )}

                  {state === "cancelled" && (
                    <p className="text-ink-muted">
                      This plan has ended. Want it back? <Link href="/contact" className="text-brand-light hover:underline">Get in touch</Link>.
                    </p>
                  )}
                </div>
                </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
