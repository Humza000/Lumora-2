import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectTimeline, UpdatesFeed } from "@/components/project-timeline";
import { Card, PageHeader, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { formatGBP } from "@/lib/money";
import { projectProgress } from "@/lib/progress";

export default async function PortalProject({ params }: PageProps<"/portal/projects/[id]">) {
  const user = await requireClient();
  const { id } = await params;
  // Scoped to the current client: other clients' projects 404.
  const project = await db.project.findFirst({
    where: { id, clientId: user.id },
    include: {
      milestones: { orderBy: { order: "asc" } },
      updates: { orderBy: { createdAt: "desc" } },
      invoices: { where: { status: { not: "DRAFT" } }, orderBy: { issueDate: "desc" } },
    },
  });
  if (!project) notFound();

  const progress = projectProgress(project.milestones);

  return (
    <>
      <Link href="/portal/projects" className="text-sm text-ink-muted hover:text-ink">
        ← All projects
      </Link>
      <div className="mt-4">
        <PageHeader title={project.title} description={project.description} actions={<StatusBadge status={project.status} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <ProgressBar value={progress} label="Overall progress" />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-ink-muted">Started</p>
                <p className="font-medium">{formatDate(project.startDate)}</p>
              </div>
              <div>
                <p className="text-ink-muted">Target launch</p>
                <p className="font-medium">{formatDate(project.dueDate)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <h2 className="mb-6 text-lg font-semibold">Timeline</h2>
            <ProjectTimeline milestones={project.milestones} />
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Latest updates</h2>
            <UpdatesFeed updates={project.updates} />
          </Card>
          {project.invoices.length > 0 && (
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Invoices</h2>
              <ul className="space-y-2 text-sm">
                {project.invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-2">
                    <Link href={`/portal/invoices/${inv.id}`} className="text-brand-light hover:underline">
                      {inv.number}
                    </Link>
                    <span>{formatGBP(inv.total)}</span>
                    <StatusBadge status={inv.status} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
