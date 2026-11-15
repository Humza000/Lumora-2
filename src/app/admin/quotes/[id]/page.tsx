import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmit } from "@/components/confirm-button";
import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms";
import { Card, PageHeader, StatusBadge, dateInputValue, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { getPriceMap } from "@/lib/prices";
import { formatGBP, penceToPounds } from "@/lib/money";
import { HOSTING_PLANS, PROJECT_TYPES, calculateEstimate, featureLabel, formatEstimate, formatHosting, quoteDraftSchema } from "@/lib/pricing";
import { answerChanges, canSendOffer, offerHosting } from "@/lib/quote-offer";
import { deleteQuote, sendQuoteOffer, updateQuoteReview, withdrawQuoteOffer } from "../../_actions/quotes";

export default async function AdminQuote({ params, searchParams }: PageProps<"/admin/quotes/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { sent, email, withdrawn } = await searchParams;
  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      user: { include: { profile: true } },
      project: { select: { id: true, title: true } },
      invoices: { select: { id: true, number: true, total: true, status: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!quote) notFound();

  const parsed = quoteDraftSchema.safeParse(quote.answers);
  const a = parsed.success ? parsed.data : {};
  const estimate = calculateEstimate(a, await getPriceMap());
  const label = <T extends readonly { key: string; label: string }[]>(list: T, key?: string) =>
    list.find((i) => i.key === key)?.label ?? "—";

  const site = a.existingSite ? (/^https?:\/\//.test(a.existingSite) ? a.existingSite : `https://${a.existingSite}`) : null;
  // Quotes submitted before the wizard was simplified also have design/timeline/budget answers.
  const raw = (quote.answers ?? {}) as Record<string, unknown>;
  const legacy = (["budget", "design", "timeline"] as const).filter((k) => typeof raw[k] === "string");

  const rows: [string, React.ReactNode][] = [
    ["Business", a.businessName],
    ["Industry", a.industry || "—"],
    ["Current site", site ? <a href={site} target="_blank" rel="noreferrer" className="text-brand-light hover:underline">{a.existingSite}</a> : "—"],
    ["Project type", label(PROJECT_TYPES, a.projectType)],
    ["Pages", a.pages],
    ["Features", a.features?.map(featureLabel).join(", ") || "None"],
    ["Additional requirements", a.featuresOther || "—"],
    ["Hosting & care", estimate.hostingPlan ? `${estimate.hostingPlan.label}${estimate.hostingPrice > 0 ? ` (billed ${estimate.hostingBilling})` : ""}` : raw.hosting === true ? "Yes (older quote)" : "—"],
    ["Goals", a.goals],
    ["Notes", a.notes || "—"],
    ...legacy.map((k): [string, React.ReactNode] => [`${k[0].toUpperCase()}${k.slice(1)} (older quote)`, String(raw[k])]),
  ];

  const canReview = ["SUBMITTED", "REVIEWING", "CHANGES_REQUESTED", "DECLINED"].includes(quote.status);
  const changes = quote.status === "CHANGES_REQUESTED" ? answerChanges(quote.previousAnswers, quote.answers) : [];
  // After a change request, the hosting they now want replaces what was last sent.
  const fresh = quote.status === "CHANGES_REQUESTED";
  const canSend = !quote.project && canSendOffer(quote.status);
  const waiting = quote.status === "SENT";
  const hasOffer = quote.price !== null;
  // Send form defaults: what was last sent, else what the client picked in the wizard.
  const offer = {
    price: quote.price ?? (quote.estimateMin === quote.estimateMax && quote.estimateMin > 0 ? quote.estimateMin : estimate.oneTime),
    hostingPlanKey: (fresh ? null : quote.hostingPlanKey) ?? estimate.hostingPlan?.key ?? "hosting_none",
    hostingBilling: (fresh ? null : quote.hostingBilling) ?? estimate.hostingBilling,
    hostingPrice: (fresh ? null : quote.hostingPrice) ?? estimate.hostingPrice,
  };

  return (
    <>
      <Link href="/admin/quotes" className="text-sm text-ink-muted hover:text-ink">
        ← All quotes
      </Link>
      <div className="mt-4">
        <PageHeader
          title={`Quote: ${a.businessName || quote.user.name}`}
          description={`Submitted ${formatDate(quote.submittedAt)}`}
          actions={
            <>
              <StatusBadge status={quote.status} />
              <ActionForm action={deleteQuote.bind(null, quote.id)} className="space-y-2">
                <ConfirmSubmit
                  message={
                    quote.project
                      ? `Delete this quote? This also deletes the project "${quote.project.title}", ALL its invoices (paid ones too, without refunding them) and any hosting plan (card payments are cancelled). The client will no longer see any of it.`
                      : "Delete this quote and any invoices for it? The client will no longer see it."
                  }
                >
                  Delete quote
                </ConfirmSubmit>
              </ActionForm>
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 font-semibold">Requirements</h2>
            <dl className="divide-y divide-line text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-4 py-2.5">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="col-span-2 whitespace-pre-line">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {sent && (
            <p role="status" className="rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
              {email === "failed"
                ? `Quote sent, but the email to ${quote.user.email} couldn't be delivered. They can still see it in their portal.`
                : `Quote sent. ${quote.user.email} has been emailed a link to view and accept it.`}
            </p>
          )}
          {withdrawn && (
            <p role="status" className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm">
              Quote withdrawn. The client can no longer accept it until you send it again.
            </p>
          )}

          {quote.status === "CHANGES_REQUESTED" && (
            <Card className="border-warning/40 bg-warning/5">
              <h2 className="font-semibold">Client requested changes</h2>
              {quote.changeRequest && <p className="mt-2 text-sm whitespace-pre-line">{quote.changeRequest}</p>}
              {changes.length > 0 ? (
                <dl className="mt-4 divide-y divide-line border-t border-line text-sm">
                  {changes.map((c) => (
                    <div key={c.label} className="grid grid-cols-3 gap-4 py-2.5">
                      <dt className="text-ink-muted">{c.label}</dt>
                      <dd className="col-span-2 whitespace-pre-line">
                        <span className="text-ink-muted line-through">{c.from}</span> → <span className="font-medium">{c.to}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm text-ink-muted">They didn&apos;t change any of their answers.</p>
              )}
              <p className="mt-4 text-sm text-ink-muted">The requirements above show their updated answers. Adjust the quote below and send it again.</p>
            </Card>
          )}

          {hasOffer && (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    {quote.status === "ACCEPTED" ? "Accepted by the client" : quote.status === "DECLINED" && quote.respondedAt ? "Declined by the client" : waiting ? "Waiting for the client" : "Last quote sent"}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    Sent {formatDate(quote.sentAt)}
                    {quote.respondedAt && quote.status !== "SENT" && quote.status !== "REVIEWING" ? ` · answered ${formatDate(quote.respondedAt)}` : ""}
                  </p>
                </div>
                {waiting && (
                  <ActionForm action={withdrawQuoteOffer.bind(null, quote.id)}>
                    <SubmitButton variant="secondary" size="sm" pendingText="Withdrawing…">
                      Withdraw quote
                    </SubmitButton>
                  </ActionForm>
                )}
              </div>
              <dl className="mt-4 divide-y divide-line border-t border-line text-sm">
                <div className="grid grid-cols-3 gap-4 py-2.5">
                  <dt className="text-ink-muted">Project price</dt>
                  <dd className="col-span-2 font-medium">{formatGBP(quote.price ?? 0)}</dd>
                </div>
                <div className="grid grid-cols-3 gap-4 py-2.5">
                  <dt className="text-ink-muted">Hosting & care</dt>
                  <dd className="col-span-2">{offerHosting(quote) ?? "—"}</dd>
                </div>
                {quote.status === "ACCEPTED" && (
                  <div className="grid grid-cols-3 gap-4 py-2.5">
                    <dt className="text-ink-muted">They chose to pay</dt>
                    <dd className="col-span-2">{quote.invoiceOnAccept === "deposit" ? "A 50% deposit now, balance before launch" : "In full"}</dd>
                  </div>
                )}
                {quote.declineReason && (
                  <div className="grid grid-cols-3 gap-4 py-2.5">
                    <dt className="text-ink-muted">Client&apos;s reason</dt>
                    <dd className="col-span-2 whitespace-pre-line">{quote.declineReason}</dd>
                  </div>
                )}
              </dl>
              {quote.project && (
                <p className="mt-4 text-sm">
                  Project:{" "}
                  <Link href={`/admin/projects/${quote.project.id}`} className="font-medium text-brand-light hover:underline">
                    {quote.project.title}
                  </Link>
                  {quote.invoices.map((inv) => (
                    <span key={inv.id}>
                      {" · "}
                      <Link href={`/admin/invoices/${inv.id}`} className="font-medium text-brand-light hover:underline">
                        {inv.number ?? "Draft invoice"}
                      </Link>{" "}
                      ({formatGBP(inv.total)}, {inv.status.toLowerCase()})
                    </span>
                  ))}
                </p>
              )}
            </Card>
          )}

          {quote.project && !hasOffer && (
            <Card>
              <p className="text-sm">
                Converted to project{" "}
                <Link href={`/admin/projects/${quote.project.id}`} className="font-medium text-brand-light hover:underline">
                  {quote.project.title}
                </Link>
              </p>
            </Card>
          )}

          {canSend && (
            <Card>
              <h2 className="font-semibold">{hasOffer ? "Change & send again" : "Send quote to client"}</h2>
              <p className="mt-1 mb-4 text-sm text-ink-muted">
                Confirm the details, then {quote.user.name} is emailed a link to view the quote. They can accept it, request changes or
                decline it. Accepting creates their project and their website invoice automatically.
              </p>
              <ActionForm action={sendQuoteOffer.bind(null, quote.id)}>
                <TextField
                  label="Project price (£)"
                  name="price"
                  inputMode="decimal"
                  defaultValue={penceToPounds(offer.price)}
                  hint="The final one-off price for the build."
                  required
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <SelectField
                    label="Hosting & care plan"
                    name="hostingPlanKey"
                    defaultValue={offer.hostingPlanKey}
                    options={HOSTING_PLANS.map((p) => ({ value: p.key, label: p.label }))}
                  />
                  <SelectField
                    label="Hosting billed"
                    name="hostingBilling"
                    defaultValue={offer.hostingBilling}
                    options={[
                      { value: "monthly", label: "Monthly" },
                      { value: "yearly", label: "Yearly" },
                    ]}
                  />
                  <TextField label="Hosting price (£)" name="hostingPrice" inputMode="decimal" defaultValue={penceToPounds(offer.hostingPrice)} />
                </div>
                <TextAreaField
                  label="Message to the client"
                  name="message"
                  defaultValue={quote.message ?? ""}
                  hint="Optional. Shown at the top of their quote and in the email."
                />
                <TextField
                  label="Project title"
                  name="projectTitle"
                  defaultValue={quote.projectTitle ?? `${a.businessName ?? quote.user.name}: ${label(PROJECT_TYPES, a.projectType)}`}
                  required
                />
                <TextAreaField label="Project description (visible to client)" name="projectDescription" defaultValue={quote.projectDescription ?? ""} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Start date" name="startDate" type="date" defaultValue={dateInputValue(quote.startDate)} />
                  <TextField label="Target launch" name="dueDate" type="date" defaultValue={dateInputValue(quote.dueDate)} />
                </div>
                <p className="text-xs text-ink-muted">
                  When they accept, they choose to pay in full or a 50% deposit, and that invoice is numbered and emailed to them
                  automatically. The project waits for payment, then work starts. Hosting isn&apos;t on that invoice: it starts when you
                  mark the project as launched.
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="defaultMilestones" defaultChecked={quote.defaultMilestones} className="accent-[var(--brand-strong)]" />
                  Add the standard 5-stage milestone plan to the project
                </label>
                <SubmitButton pendingText="Sending…">{hasOffer ? "Send updated quote" : "Send quote to client"}</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold">Client</h2>
            <p className="mt-3 text-sm font-medium">
              <Link href={`/admin/clients/${quote.user.id}`} className="text-brand-light hover:underline">
                {quote.user.name}
              </Link>
            </p>
            <p className="text-sm text-ink-muted">{quote.user.email}</p>
            {quote.user.profile?.phone && <p className="text-sm text-ink-muted">{quote.user.profile.phone}</p>}
          </Card>

          <Card>
            <h2 className="font-semibold">Estimate</h2>
            <p className="mt-2 text-xl font-semibold">{formatEstimate(quote.estimateMin, quote.estimateMax)}</p>
            <p className="text-xs text-ink-muted">One-time development, as shown to the client at submission</p>
            <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <li className="flex justify-between gap-2">
                <span className="text-ink-muted">Hosting & care</span>
                <span>{estimate.hostingPlan ? (estimate.hostingPrice > 0 ? formatHosting(estimate) : "None") : "—"}</span>
              </li>
              {estimate.customQuote && <li className="text-warning">May need a custom quote</li>}
            </ul>
          </Card>

          {canReview && (
            <Card>
              <h2 className="mb-4 font-semibold">Review</h2>
              <ActionForm action={updateQuoteReview.bind(null, quote.id)}>
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue={quote.status}
                  options={[
                    { value: "SUBMITTED", label: "Submitted" },
                    { value: "REVIEWING", label: "Reviewing" },
                    ...(quote.status === "CHANGES_REQUESTED" ? [{ value: "CHANGES_REQUESTED", label: "Changes requested" }] : []),
                    { value: "DECLINED", label: "Declined" },
                  ]}
                />
                <TextAreaField label="Internal notes" name="adminNotes" defaultValue={quote.adminNotes ?? ""} />
                <SubmitButton variant="secondary">Save</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
