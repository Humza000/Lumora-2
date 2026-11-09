import { SelectField, TextAreaField, TextField } from "@/components/forms";
import { dateInputValue } from "@/components/ui";

export const PROJECT_STATUS_OPTIONS = [
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "REVIEW", label: "In review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On hold" },
];

type Defaults = {
  title?: string;
  description?: string | null;
  clientId?: string;
  status?: string;
  startDate?: Date | null;
  dueDate?: Date | null;
};

export function ProjectFields({ clients, d = {} }: { clients: { id: string; name: string }[]; d?: Defaults }) {
  return (
    <>
      <TextField label="Title" name="title" defaultValue={d.title} required />
      <SelectField
        label="Client"
        name="clientId"
        defaultValue={d.clientId ?? ""}
        options={[{ value: "", label: "Choose a client…" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
      />
      <TextAreaField label="Description (visible to client)" name="description" defaultValue={d.description ?? ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="Status" name="status" defaultValue={d.status ?? "PLANNING"} options={PROJECT_STATUS_OPTIONS} />
        <TextField label="Start date" name="startDate" type="date" defaultValue={dateInputValue(d.startDate)} />
        <TextField label="Target launch" name="dueDate" type="date" defaultValue={dateInputValue(d.dueDate)} />
      </div>
    </>
  );
}
