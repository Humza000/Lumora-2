import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton, TextAreaField } from "@/components/forms";
import { ButtonLink, Card, PageHeader, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { formatGBP } from "@/lib/money";
import { quoteStatusNote } from "@/lib/portal";
import { formatEstimate, quoteDraftSchema, summariseQuote } from "@/lib/pricing";
import { canRespond, offerHosting, offerInvoiceAmount } from "@/lib/quote-offer";
import { acceptQuoteOffer, declineQuoteOffer } from "../actions";

export const metadata = { title: "Your quote" };

export default async function PortalQuote({ params, searchParams }: PageProps<"/portal/quotes/[id]">) {
  const user = await requireClient();
  const { id } = await params;
  const { decline, declined, changes } = await searchParams;
  // Scoped to the current client: other clients' quotes 404. Drafts live in the wizard.
  const quote = await db.quote.findFirst({
    where: { id, userId: user.id, status: { not: "DRAFT" } },
    include: { project: { select: { id: true, title: true } } },
  });
  if (!quote) notFound();

  const parsed = quoteDraftSchema.safeParse(quote.answers);
  const a = parsed.success ? parsed.data : {};
  const summary = summariseQuote(quote.answers);
  const open = canRespond(quote.status);
  // The confirmed price is only shown once we've sent it (and stays visible afterwards).
  const confirmed = quote.price !== null && (open || quote.status === "ACCEPTED" || (quote.status === "DECLINED" && quote.respondedAt !== null));
  const hosting = offerHosting(quote);
  const paidHosting = Boolean(quote.hostingPrice);

  const rows: [string, React.ReactNode][] = [
    ["Business", a.businessName || "—"],
    ["Package", summary.packageName ?? "—"],
    ["Pages", a.pages ?? "—"],
    ["Features", summary.features.join(", ") || "None"],
    ...(a.featuresOther ? ([["Additional requirements", a.featuresOther]] as [string, React.ReactNode][]) : []),
    ["Goals", a.goals || "—"],
  ];

  return (
    <>
      <Link href="/portal/quotes" className="text-sm text-ink-muted hover:text-ink">
        ← All quotes
      </Link>
      <div className="mt-4">
        <PageHeader
          title={`Quote: ${a.businessName || summary.packageName || "your project"}`}
          description={confirmed ? `Sent to you on ${formatDate(quote.sentAt)}` : `Submitted ${formatDate(quote.submittedAt)}`}
          actions={<StatusBadge status={quote.status} label={open ? "Awaiting your reply" : undefined} />}
        />
      </div>

      {changes && quote.status === "CHANGES_REQUESTED" && (
        <p role="status" className="mb-6 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          Thanks, we&apos;ve got your changes. We&apos;ll review them and send you an updated quote, usually within 2 working days.
        </p>
      )}
      {declined && (
        <p role="status" className="mb-6 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm">
          You&apos;ve declined this quote and we&apos;ve been told. If you&apos;d like something changed, just reply to our email.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {confirmed && quote.message && (
            <Card>
              <h2 className="font-semibold">A note from us</h2>
              <p className="mt-2 text-sm whitespace-pre-line text-ink-muted">{quote.message}</p>
            </Card>
          )}

          <Card>
            <h2 className="mb-4 font-semibold">What&apos;s included</h2>
            <dl className="divide-y divide-line text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-4 py-2.5">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="col-span-2 whitespace-pre-line">{v}</dd>
                </div>
              ))}
              {confirmed && (quote.startDate || quote.dueDate) && (
                <div className="grid grid-cols-3 gap-4 py-2.5">
                  <dt className="text-ink-muted">Timeline</dt>
                  <dd className="col-span-2">
                    {quote.startDate ? `Starts ${formatDate(quote.startDate)}` : ""}
                    {quote.startDate && quote.dueDate ? " · " : ""}
                    {quote.dueDate ? `target launch ${formatDate(quote.dueDate)}` : ""}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        {/* On phones the price and the decision come first; on desktop they sit in the right column. */}
        <div className="order-first space-y-6 lg:order-none">
          <Card>
            <h2 className="font-semibold">{confirmed ? "Your price" : "Estimate"}</h2>
            {confirmed ? (
              <>
                <p className="mt-2 text-2xl font-semibold">{formatGBP(quote.price ?? 0)}</p>
                <p className="text-xs text-ink-muted">One-off price for the design and build</p>
                <p className="mt-4 border-t border-line pt-4 text-sm">
                  <span className="text-ink-muted">Hosting & care: </span>
                  {hosting ?? "Not included"}
                </p>
                {quote.hostingPrice ? (
                  <p className="mt-1 text-xs text-ink-muted">
                    Starts when your site goes live, then renews automatically by card. You can cancel any time.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="mt-2 text-xl font-semibold">{formatEstimate(quote.estimateMin, quote.estimateMax)}</p>
                <p className="mt-2 text-sm text-ink-muted">{quoteStatusNote(quote.status)}</p>
              </>
            )}
          </Card>

          {open && (
            <Card>
              <h2 className="font-semibold">Your decision</h2>
              {decline ? (
                <>
                  <p className="mt-2 mb-4 text-sm text-ink-muted">
                    No problem. If you tell us why, we can send you a revised quote.
                  </p>
                  <ActionForm action={declineQuoteOffer.bind(null, quote.id)}>
                    <TextAreaField label="Reason (optional)" name="reason" maxLength={1000} />
                    <div className="flex flex-wrap gap-3">
                      <SubmitButton variant="danger" pendingText="Declining…">
                        Yes, decline quote
                      </SubmitButton>
                      <ButtonLink href={`/portal/quotes/${quote.id}`} variant="secondary">
                        Go back
                      </ButtonLink>
                    </div>
                  </ActionForm>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-ink-muted">Happy with everything? Choose how you&apos;d like to pay, then accept.</p>
                  <ActionForm action={acceptQuoteOffer.bind(null, quote.id)} className="mt-4">
                    <fieldset className="space-y-2">
                      <legend className="sr-only">How would you like to pay?</legend>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm has-checked:border-brand has-checked:bg-brand-soft">
                        <input type="radio" name="payment" value="full" defaultChecked className="mt-1 accent-[var(--brand-strong)]" />
                        <span>
                          <span className="font-medium">Pay in full: {formatGBP(offerInvoiceAmount(quote.price, "full"))}</span>
                          <span className="block text-xs text-ink-muted">One invoice, nothing more to pay for the build.</span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm has-checked:border-brand has-checked:bg-brand-soft">
                        <input type="radio" name="payment" value="deposit" className="mt-1 accent-[var(--brand-strong)]" />
                        <span>
                          <span className="font-medium">Pay a 50% deposit: {formatGBP(offerInvoiceAmount(quote.price, "deposit"))}</span>
                          <span className="block text-xs text-ink-muted">The other half is invoiced before your site goes live.</span>
                        </span>
                      </label>
                    </fieldset>
                    <SubmitButton pendingText="Accepting…" className="w-full">
                      Accept quote
                    </SubmitButton>
                  </ActionForm>
                  <ul className="mt-4 space-y-1.5 text-xs text-ink-muted">
                    <li>• Accepting sets up your project and we email your invoice straight away.</li>
                    <li>• Work starts as soon as that invoice is paid.</li>
                    {paidHosting && <li>• Hosting ({hosting}) only starts when your site goes live.</li>}
                  </ul>
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-sm font-medium">Want something different?</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Edit your answers and tell us what to change. We&apos;ll send you an updated quote.
                    </p>
                    <ButtonLink href={`/portal/quote?changes=${quote.id}`} variant="secondary" className="mt-3 w-full">
                      Request changes
                    </ButtonLink>
                    <ButtonLink href={`/portal/quotes/${quote.id}?decline=1`} variant="ghost" className="mt-2 w-full">
                      Decline quote
                    </ButtonLink>
                  </div>
                </>
              )}
            </Card>
          )}

          {quote.status === "ACCEPTED" && (
            <Card>
              <h2 className="font-semibold">Accepted</h2>
              <p className="mt-2 text-sm text-ink-muted">
                {quote.respondedAt ? `You accepted this quote on ${formatDate(quote.respondedAt)}.` : "This quote was accepted."}
              </p>
              {quote.project && (
                <ButtonLink href={`/portal/projects/${quote.project.id}`} variant="secondary" className="mt-4">
                  View your project
                </ButtonLink>
              )}
            </Card>
          )}

          {quote.status === "CHANGES_REQUESTED" && (
            <Card>
              <h2 className="font-semibold">Changes requested</h2>
              <p className="mt-2 text-sm text-ink-muted">We&apos;re updating your quote and will email you when it&apos;s ready.</p>
              {quote.changeRequest && <p className="mt-3 border-t border-line pt-3 text-sm whitespace-pre-line">{quote.changeRequest}</p>}
            </Card>
          )}

          {quote.status === "DECLINED" && !declined && (
            <Card>
              <h2 className="font-semibold">{quote.respondedAt ? "You declined this quote" : "Quote closed"}</h2>
              <p className="mt-2 text-sm text-ink-muted">
                {quote.respondedAt ? "If you'd like something changed, get in touch and we can send a revised quote." : "This quote is closed."}
              </p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
