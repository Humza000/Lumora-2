import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { createProject } from "../../_actions/projects";
import { ProjectFields } from "../project-fields";

export const metadata = { title: "New project" };

export default async function NewProject({ searchParams }: PageProps<"/admin/projects/new">) {
  await requireAdmin();
  const { client } = await searchParams;
  const clients = await db.user.findMany({ where: { role: "CLIENT" }, select: { id: true, name: true }, orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader title="New project" />
      <Card className="max-w-2xl">
        <ActionForm action={createProject}>
          <ProjectFields clients={clients} d={{ clientId: typeof client === "string" ? client : undefined }} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="defaultMilestones" defaultChecked className="accent-[var(--brand)]" />
            Add the standard 5-stage milestone plan
          </label>
          <SubmitButton>Create project</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
