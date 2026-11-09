import { TextAreaField, TextField } from "@/components/forms";

type Defaults = { name?: string; email?: string; company?: string | null; phone?: string | null; address?: string | null };

export function ClientFields({ d = {} }: { d?: Defaults }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" name="name" defaultValue={d.name} required />
        <TextField label="Email" name="email" type="email" defaultValue={d.email} required />
        <TextField label="Company" name="company" defaultValue={d.company ?? ""} />
        <TextField label="Phone" name="phone" defaultValue={d.phone ?? ""} />
      </div>
      <TextAreaField label="Billing address" name="address" defaultValue={d.address ?? ""} className="[&_textarea]:min-h-20" />
    </>
  );
}
