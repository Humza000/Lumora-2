import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/dal";
import { inviteClient } from "../../_actions/clients";
import { ClientFields } from "../client-fields";

export const metadata = { title: "Invite client" };

export default async function NewClient() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Invite a client"
        description="Creates their account and emails them a link to set a password (valid for 7 days)."
      />
      <Card className="max-w-2xl">
        <ActionForm action={inviteClient}>
          <ClientFields />
          <SubmitButton pendingText="Sending invite…">Create & send invite</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
