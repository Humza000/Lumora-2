import Link from "next/link";
import { ButtonLink, EmptyState, PageHeader, ProgressBar, StatusBadge, Table, Td, Th, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { projectProgress } from "@/lib/progress";

export const metadata = { title: "Projects" };

export default async function AdminProjects() {
  await requireAdmin();
  const projects = await db.project.findMany({
    include: { client: { select: { name: true } }, milestones: { select: { status: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return (
    <>
      <PageHeader title="Projects" actions={<ButtonLink href="/admin/projects/new">New project</ButtonLink>} />
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Accept a quote or create a project manually." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Project</Th>
              <Th>Client</Th>
              <Th className="w-48">Progress</Th>
              <Th>Due</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <Td>
                  <Link href={`/admin/projects/${p.id}`} className="font-medium text-brand hover:underline">
                    {p.title}
                  </Link>
                </Td>
                <Td>{p.client.name}</Td>
                <Td>
                  <ProgressBar value={projectProgress(p.milestones)} />
                </Td>
                <Td>{formatDate(p.dueDate)}</Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
