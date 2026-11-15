import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton, TextAreaField, TextField } from "@/components/forms";
import { ButtonLink, Card, PageHeader, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { formatGBP } from "@/lib/money";
import { projectProgress } from "@/lib/progress";
import { hostingFromQuote, offerHosting } from "@/lib/quote-offer";
import {
  addMilestone,
  deleteMilestone,
  deleteUpdate,
  launchProject,
  moveMilestone,
  postUpdate,
  setMilestoneStatus,
  updateProject,
} from "../../_actions/projects";
import { ProjectFields } from "../project-fields";
import { MilestoneStatus } from "./milestone-status";

export default async function AdminProject({ params, searchParams }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { launched, email } = await searchParams;
  const [project, clients] = await Promise.all([
    db.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        milestones: { orderBy: { order: "asc" } },
        updates: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        hostingPlans: true,
        quote: { select: { id: true, hostingPlanKey: true, hostingBilling: true, hostingPrice: true } },
      },
    }),
    db.user.findMany({ where: { role: "CLIENT" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!project) notFound();
  const hosting = project.quote && project.hostingPlans.length === 0 ? hostingFromQuote(project.quote) : null;
  const unpaid = project.invoices.find((i) => i.status === "SENT" || i.status === "OVERDUE");

  return (
    <>
      <Link href="/admin/projects" className="text-sm text-ink-muted hover:text-ink">
        ← All projects
      </Link>
      <div className="mt-4">
        <PageHeader
          title={project.title}
          description={
            <>
              Client:{" "}
              <Link href={`/admin/clients/${project.client.id}`} className="text-brand-light hover:underline">
                {project.client.name}
              </Link>
              {project.quote && (
                <>
                  {" · "}
                  <Link href={`/admin/quotes/${project.quote.id}`} className="text-brand-light hover:underline">
                    Original quote
                  </Link>
                </>
              )}
            </>
          }
          actions={<StatusBadge status={project.status} />}
        />
      </div>

      {launched && (
        <p role="status" className="mb-6 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          {launched === "hosting"
            ? email === "failed"
              ? `Project launched and the hosting plan was created, but the email to ${project.client.email} couldn't be delivered. They can still start it from their portal.`
              : `Project launched. ${project.client.email} has been emailed to start their hosting plan by card; it then renews automatically.`
            : "Project marked as launched."}
        </p>
      )}
      {project.status === "AWAITING_PAYMENT" && (
        <p className="mb-6 rounded-xl border border-warning/40 bg-warning/5 px-4 py-3 text-sm">
          Waiting for payment{unpaid ? <> of invoice <Link href={`/admin/invoices/${unpaid.id}`} className="font-medium text-brand-light hover:underline">{unpaid.number}</Link> ({formatGBP(unpaid.total)})</> : null}.
          The project moves to Planning automatically when it&apos;s paid.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Milestones</h2>
              <span className="text-sm text-ink-muted">Clients see these as their project timeline</span>
            </div>
            <ProgressBar value={projectProgress(project.milestones)} label="Progress" />
            <ul className="mt-6 divide-y divide-line">
              {project.milestones.map((m, i) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="flex flex-col">
                    <form action={moveMilestone.bind(null, m.id, "up")}>
                      <button disabled={i === 0} className="px-1 text-xs text-ink-muted hover:text-ink disabled:opacity-30" aria-label="Move up">
                        ▲
                      </button>
                    </form>
                    <form action={moveMilestone.bind(null, m.id, "down")}>
                      <button
                        disabled={i === project.milestones.length - 1}
                        className="px-1 text-xs text-ink-muted hover:text-ink disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                    </form>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-ink-muted">
                      {m.description}
                      {m.dueDate && ` · Target ${formatDate(m.dueDate)}`}
                      {m.completedAt && ` · Done ${formatDate(m.completedAt)}`}
                    </p>
                  </div>
                  <MilestoneStatus action={setMilestoneStatus.bind(null, m.id)} value={m.status} />
                  <form action={deleteMilestone.bind(null, m.id)}>
                    <button className="text-xs text-danger hover:underline">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
            <details className="mt-4 rounded-xl border border-line/70 bg-ink/[0.015] p-4 transition-colors open:border-brand-light/30">
              <summary className="cursor-pointer text-sm font-medium">Add milestone</summary>
              <ActionForm action={addMilestone.bind(null, project.id)} className="mt-4" resetOnSuccess>
                <TextField label="Title" name="title" required />
                <TextField label="Description" name="description" />
                <TextField label="Target date" name="dueDate" type="date" className="max-w-xs" />
                <SubmitButton variant="secondary">Add milestone</SubmitButton>
              </ActionForm>
            </details>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold">Client updates</h2>
            <ActionForm action={postUpdate.bind(null, project.id)} resetOnSuccess>
              <TextAreaField label="Post an update" name="body" placeholder="e.g. Homepage design is ready for your review…" />
              <SubmitButton>Post update</SubmitButton>
            </ActionForm>
            <ul className="mt-6 space-y-3">
              {project.updates.map((u) => (
                <li key={u.id} className="rounded-xl border border-line/50 bg-ink/[0.025] p-4">
                  <div className="flex justify-between text-xs text-ink-muted">
                    <span>{formatDate(u.createdAt)}</span>
                    <form action={deleteUpdate.bind(null, u.id)}>
                      <button className="text-danger hover:underline">Delete</button>
                    </form>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-line">{u.body}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          {project.status !== "COMPLETED" && project.status !== "AWAITING_PAYMENT" && (
            <Card>
              <h2 className="font-semibold">Launch</h2>
              <p className="mt-1 mb-4 text-sm text-ink-muted">
                {hosting
                  ? `Marks the project as launched and starts ${offerHosting(project.quote!)}: the client is emailed to make their first payment by card, then it renews automatically.`
                  : "Marks the project as launched, completes the milestones and tells the client."}
              </p>
              <ActionForm action={launchProject.bind(null, project.id)}>
                {hosting && (
                  <>
                    <TextField label="Live domain" name="domain" placeholder="example.co.uk" required />
                    <TextField label="Hosting provider" name="provider" defaultValue="Vercel" />
                  </>
                )}
                <SubmitButton pendingText="Launching…">Mark as launched</SubmitButton>
              </ActionForm>
            </Card>
          )}
          <Card>
            <h2 className="mb-4 font-semibold">Project details</h2>
            <ActionForm action={updateProject.bind(null, project.id)}>
              <ProjectFields clients={clients} d={project} />
              <SubmitButton variant="secondary">Save</SubmitButton>
            </ActionForm>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Invoices</h2>
              <ButtonLink href={`/admin/invoices/new?client=${project.client.id}&project=${project.id}${project.quote ? `&quote=${project.quote.id}` : ""}`} variant="secondary" size="sm">
                New
              </ButtonLink>
            </div>
            {project.invoices.length === 0 ? (
              <p className="text-sm text-ink-muted">No invoices</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {project.invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-2">
                    <Link href={`/admin/invoices/${inv.id}`} className="text-brand-light hover:underline">
                      {inv.number ?? "Draft"}
                    </Link>
                    <span>{formatGBP(inv.total)}</span>
                    <StatusBadge status={inv.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Hosting</h2>
              <ButtonLink href={`/admin/hosting/new?client=${project.client.id}&project=${project.id}`} variant="secondary" size="sm">
                Add
              </ButtonLink>
            </div>
            {project.hostingPlans.length === 0 ? (
              <p className="text-sm text-ink-muted">No hosting plan</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {project.hostingPlans.map((h) => (
                  <li key={h.id} className="flex justify-between">
                    <Link href={`/admin/hosting/${h.id}`} className="text-brand-light hover:underline">
                      {h.domain}
                    </Link>
                    <StatusBadge status={h.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
