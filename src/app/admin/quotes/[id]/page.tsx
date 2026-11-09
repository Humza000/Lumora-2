import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms";
import { Card, PageHeader, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { formatGBP } from "@/lib/money";
import { getPriceMap } from "@/lib/prices";
import { DESIGN_OPTIONS, EXTRAS, FEATURES, PROJECT_TYPES, TIMELINES, calculateEstimate, quoteDraftSchema } from "@/lib/pricing";
import { acceptQuote, updateQuoteReview } from "../../_actions/quotes";

export default async function AdminQuote({ params }: PageProps<"/admin/quotes/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const quote = await db.quote.findUnique({
    where: { id },
    include: { user: { include: { profile: true } }, project: { select: { id: true, title: true } } },
  });
  if (!quote) notFound();

  const parsed = quoteDraftSchema.safeParse(quote.answers);
  const a = parsed.success ? parsed.data : {};
  const estimate = calculateEstimate(a, await getPriceMap());
  const label = <T extends readonly { key: string; label: string }[]>(list: T, key?: string) =>
    list.find((i) => i.key === key)?.label ?? "—";

  const rows: [string, React.ReactNode][] = [
    ["Business", a.businessName],
    ["Industry", a.industry || "—"],
    ["Current site", a.existingSite ? <a href={a.existingSite} target="_blank" rel="noreferrer" className="text-brand hover:underline">{a.existingSite}</a> : "—"],
    ["Project type", label(PROJECT_TYPES, a.projectType)],
    ["Pages", a.pages],
    ["Features", a.features?.map((k) => label(FEATURES, k)).join(", ") || "None"],
    ["Design", label(DESIGN_OPTIONS, a.design)],
    ["Extras", a.extras?.map((k) => label(EXTRAS, k)).join(", ") || "None"],
    ["Hosting & care", a.hosting ? "Yes" : "No"],
    ["Timeline", label(TIMELINES, a.timeline)],
    ["Budget", a.budget ?? "—"],
    ["Goals", a.goals],
    ["Notes", a.notes || "—"],
  ];

  const canAct = quote.status === "SUBMITTED" || quote.status === "REVIEWING" || quote.status === "DECLINED";

  return (
    <>
      <Link href="/admin/quotes" className="text-sm text-ink-muted hover:text-ink">
        ← All quotes
      </Link>
      <div className="mt-4">
        <PageHeader
          title={`Quote: ${a.businessName || quote.user.name}`}
          description={`Submitted ${formatDate(quote.submittedAt)}`}
          actions={<StatusBadge status={quote.status} />}
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

          {quote.project ? (
            <Card>
              <p className="text-sm">
                Converted to project{" "}
                <Link href={`/admin/projects/${quote.project.id}`} className="font-medium text-brand hover:underline">
                  {quote.project.title}
                </Link>
              </p>
            </Card>
          ) : (
            canAct && (
              <Card>
                <h2 className="font-semibold">Accept & create project</h2>
                <p className="mt-1 mb-4 text-sm text-ink-muted">
                  Creates a project for {quote.user.name} that they can follow in their portal.
                </p>
                <ActionForm action={acceptQuote.bind(null, quote.id)}>
                  <TextField
                    label="Project title"
                    name="title"
                    defaultValue={`${a.businessName ?? quote.user.name}: ${label(PROJECT_TYPES, a.projectType)}`}
                    required
                  />
                  <TextAreaField label="Description (visible to client)" name="description" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Start date" name="startDate" type="date" />
                    <TextField label="Target launch" name="dueDate" type="date" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="defaultMilestones" defaultChecked className="accent-[var(--brand)]" />
                    Add the standard 5-stage milestone plan
                  </label>
                  <SubmitButton pendingText="Creating…">Accept & create project</SubmitButton>
                </ActionForm>
              </Card>
            )
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold">Client</h2>
            <p className="mt-3 text-sm font-medium">
              <Link href={`/admin/clients/${quote.user.id}`} className="text-brand hover:underline">
                {quote.user.name}
              </Link>
            </p>
            <p className="text-sm text-ink-muted">{quote.user.email}</p>
            {quote.user.profile?.phone && <p className="text-sm text-ink-muted">{quote.user.profile.phone}</p>}
          </Card>

          <Card>
            <h2 className="font-semibold">Estimate</h2>
            <p className="mt-2 text-xl font-semibold">
              {formatGBP(quote.estimateMin, { whole: true })} – {formatGBP(quote.estimateMax, { whole: true })}
            </p>
            <p className="text-xs text-ink-muted">As shown to the client at submission</p>
            <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              {estimate.lines.map((l) => (
                <li key={l.label} className="flex justify-between gap-2">
                  <span className="text-ink-muted">{l.label}</span>
                  <span>{formatGBP(l.amount, { whole: true })}</span>
                </li>
              ))}
              {estimate.uplift > 0 && (
                <li className="flex justify-between gap-2">
                  <span className="text-ink-muted">Rush uplift</span>
                  <span>{formatGBP(estimate.uplift, { whole: true })}</span>
                </li>
              )}
              <li className="flex justify-between gap-2 border-t border-line pt-1.5 font-medium">
                <span>Base total (current prices)</span>
                <span>{formatGBP(estimate.total, { whole: true })}</span>
              </li>
              {estimate.monthlyHosting > 0 && (
                <li className="flex justify-between gap-2 text-ink-muted">
                  <span>Hosting</span>
                  <span>{formatGBP(estimate.monthlyHosting, { whole: true })}/mo</span>
                </li>
              )}
            </ul>
          </Card>

          {canAct && (
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
