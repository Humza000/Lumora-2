import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { createHostingPlan } from "../../_actions/hosting";
import { HostingFields } from "../hosting-fields";

export const metadata = { title: "Add hosting plan" };

export default async function NewHostingPlan({ searchParams }: PageProps<"/admin/hosting/new">) {
  await requireAdmin();
  const { client, project } = await searchParams;
  const [clients, projects] = await Promise.all([
    db.user.findMany({ where: { role: "CLIENT" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.project.findMany({ select: { id: true, title: true, clientId: true } }),
  ]);

  return (
    <>
      <PageHeader title="Add hosting plan" />
      <Card className="max-w-3xl">
        <ActionForm action={createHostingPlan}>
          <HostingFields
            clients={clients}
            projects={projects}
            d={{
              clientId: typeof client === "string" ? client : undefined,
              projectId: typeof project === "string" ? project : undefined,
            }}
          />
          <SubmitButton>Add plan</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
