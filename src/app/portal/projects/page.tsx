import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { projectProgress } from "@/lib/progress";

export const metadata = { title: "Projects" };

export default async function PortalProjects() {
  const user = await requireClient();
  const projects = await db.project.findMany({
    where: { clientId: user.id },
    include: { milestones: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Projects" />
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" action={<ButtonLink href="/quote">Get a quote</ButtonLink>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/portal/projects/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{p.title}</h2>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-5">
                  <ProgressBar value={projectProgress(p.milestones)} label="Progress" />
                </div>
                <p className="mt-3 text-xs text-ink-muted">Started {formatDate(p.startDate ?? p.createdAt)}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
