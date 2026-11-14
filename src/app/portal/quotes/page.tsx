import { ButtonLink, Card, EmptyState, PageHeader, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { formatGBP } from "@/lib/money";
import { quoteStatusNote } from "@/lib/portal";
import { PROJECT_TYPES, quoteDraftSchema } from "@/lib/pricing";

export const metadata = { title: "Quotes" };

export default async function PortalQuotes({ searchParams }: PageProps<"/portal/quotes">) {
  const user = await requireClient();
  const { submitted } = await searchParams;
  const quotes = await db.quote.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });

  return (
    <>
      <PageHeader title="Quotes" actions={<ButtonLink href="/quote">New quote</ButtonLink>} />
      {submitted && <p className="mb-6 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">Quote submitted, thank you!</p>}
      {quotes.length === 0 ? (
        <EmptyState title="No quotes yet" description="Answer a few questions to get an instant estimate." action={<ButtonLink href="/quote">Get a quote</ButtonLink>} />
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => {
            const a = quoteDraftSchema.safeParse(q.answers);
            const answers = a.success ? a.data : {};
            const type = PROJECT_TYPES.find((t) => t.key === answers.projectType);
            return (
              <Card key={q.id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {answers.businessName || "Untitled"} · {type?.label ?? "Project"}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {q.status === "DRAFT" ? `Last edited ${formatDate(q.updatedAt)}` : `Submitted ${formatDate(q.submittedAt)}`}
                  </p>
                  {quoteStatusNote(q.status) && <p className="mt-1 text-sm text-ink-muted">{quoteStatusNote(q.status)}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {formatGBP(q.estimateMin, { whole: true })} – {formatGBP(q.estimateMax, { whole: true })}
                  </span>
                  <StatusBadge status={q.status} />
                  {q.status === "DRAFT" && (
                    <ButtonLink href="/quote" variant="secondary" size="sm">
                      Continue
                    </ButtonLink>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
