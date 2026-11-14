import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, ButtonLink, Card, PageHeader, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { effectiveStatus } from "@/lib/invoice";
import { formatGBP } from "@/lib/money";
import { formatEstimate } from "@/lib/pricing";
import { resendInvite, updateClient } from "../../_actions/clients";
import { ClientFields } from "../client-fields";

export default async function AdminClient({ params }: PageProps<"/admin/clients/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const client = await db.user.findFirst({
    where: { id, role: "CLIENT" },
    include: {
      profile: true,
      projects: { orderBy: { createdAt: "desc" } },
      quotes: { where: { status: { not: "DRAFT" } }, orderBy: { submittedAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
      hostingPlans: { orderBy: { renewalDate: "asc" } },
    },
  });
  if (!client) notFound();

  return (
    <>
      <Link href="/admin/clients" className="text-sm text-ink-muted hover:text-ink">
        ← All clients
      </Link>
      <div className="mt-4">
        <PageHeader
          title={client.name}
          description={client.profile?.company ?? client.email}
          actions={
            <>
              <ButtonLink href={`/admin/projects/new?client=${client.id}`} variant="secondary" size="sm">
                New project
              </ButtonLink>
              <ButtonLink href={`/admin/invoices/new?client=${client.id}`} variant="secondary" size="sm">
                New invoice
              </ButtonLink>
              <ButtonLink href={`/admin/hosting/new?client=${client.id}`} variant="secondary" size="sm">
                Add hosting plan
              </ButtonLink>
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Projects" empty="No projects">
            {client.projects.map((p) => (
              <Row key={p.id} href={`/admin/projects/${p.id}`} title={p.title} meta={`Due ${formatDate(p.dueDate)}`} status={p.status} />
            ))}
          </Section>
          <Section title="Invoices" empty="No invoices">
            {client.invoices.map((i) => (
              <Row
                key={i.id}
                href={`/admin/invoices/${i.id}`}
                title={i.number ?? "Draft"}
                meta={formatGBP(i.total)}
                status={effectiveStatus(i.status, i.dueDate)}
              />
            ))}
          </Section>
          <Section title="Hosting & maintenance" empty="No hosting plans">
            {client.hostingPlans.map((h) => (
              <Row key={h.id} href={`/admin/hosting/${h.id}`} title={h.domain} meta={`Renews ${formatDate(h.renewalDate)}`} status={h.status} />
            ))}
          </Section>
          <Section title="Quotes" empty="No submitted quotes">
            {client.quotes.map((q) => (
              <Row
                key={q.id}
                href={`/admin/quotes/${q.id}`}
                title={`Quote ${formatDate(q.submittedAt)}`}
                meta={formatEstimate(q.estimateMin, q.estimateMax)}
                status={q.status}
              />
            ))}
          </Section>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Details</h2>
              {client.emailVerified ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Invite pending</Badge>}
            </div>
            <ActionForm action={updateClient.bind(null, client.id)}>
              <ClientFields d={{ ...client, ...client.profile }} />
              <SubmitButton variant="secondary">Save</SubmitButton>
            </ActionForm>
          </Card>
          {!client.emailVerified && (
            <Card>
              <p className="mb-3 text-sm text-ink-muted">This client hasn&apos;t activated their account yet.</p>
              <ActionForm action={resendInvite.bind(null, client.id)}>
                <SubmitButton variant="secondary" pendingText="Sending…">
                  Send invitation email
                </SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <Card>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children.length === 0 ? <p className="text-sm text-ink-muted">{empty}</p> : <ul className="divide-y divide-line">{children}</ul>}
    </Card>
  );
}

function Row({ href, title, meta, status }: { href: string; title: string; meta: string; status: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <Link href={href} className="font-medium text-brand-light hover:underline">
        {title}
      </Link>
      <span className="ml-auto text-ink-muted">{meta}</span>
      <StatusBadge status={status} />
    </li>
  );
}
