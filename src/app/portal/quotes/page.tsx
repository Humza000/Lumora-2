import { ButtonLink, Card, EmptyState, PageHeader, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { quoteStatusNote } from "@/lib/portal";
import Link from "next/link";
import { formatGBP } from "@/lib/money";
import { PROJECT_TYPES, formatEstimate, quoteDraftSchema } from "@/lib/pricing";

export const metadata = { title: "Quotes" };

export default async function PortalQuotes({ searchParams }: PageProps<"/portal/quotes">) {
  const user = await requireClient();
  const { submitted } = await searchParams;
  const quotes = await db.quote.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });

  return (
    <>
      <PageHeader title="Quotes" actions={<ButtonLink href="/portal/quote">New quote</ButtonLink>} />
      {submitted && <p className="mb-6 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">Quote submitted, thank you!</p>}
      {quotes.length === 0 ? (
        <EmptyState title="No quotes yet" description="Answer a few questions to get an instant estimate." action={<ButtonLink href="/portal/quote">Get a quote</ButtonLink>} />
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
                    {q.status === "DRAFT" ? (
                      <>
                        {answers.businessName || "Untitled"} · {type?.label ?? "Project"}
                      </>
                    ) : (
                      <Link href={`/portal/quotes/${q.id}`} className="hover:text-brand-light hover:underline">
                        {answers.businessName || "Untitled"} · {type?.label ?? "Project"}
                      </Link>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {q.status === "DRAFT" ? `Last edited ${formatDate(q.updatedAt)}` : `Submitted ${formatDate(q.submittedAt)}`}
                  </p>
                  {quoteStatusNote(q.status) && <p className="mt-1 text-sm text-ink-muted">{quoteStatusNote(q.status)}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {q.price !== null && (q.status === "SENT" || q.status === "ACCEPTED") ? formatGBP(q.price) : formatEstimate(q.estimateMin, q.estimateMax)}
                  </span>
                  <StatusBadge status={q.status} label={q.status === "SENT" ? "Awaiting your reply" : q.status === "CHANGES_REQUESTED" ? "Changes requested" : undefined} />
                  {q.status === "SENT" && (
                    <ButtonLink href={`/portal/quotes/${q.id}`} size="sm">
                      View & respond
                    </ButtonLink>
                  )}
                  {q.status !== "DRAFT" && q.status !== "SENT" && (
                    <ButtonLink href={`/portal/quotes/${q.id}`} variant="secondary" size="sm">
                      View
                    </ButtonLink>
                  )}
                  {q.status === "DRAFT" && (
                    <ButtonLink href="/portal/quote" variant="secondary" size="sm">
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
