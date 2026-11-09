"use client";

import { useState } from "react";
import { SelectField, TextAreaField, TextField } from "@/components/forms";
import { dateInputValue } from "@/components/ui";

type Defaults = {
  clientId?: string;
  projectId?: string | null;
  domain?: string;
  provider?: string;
  planName?: string;
  includesMaintenance?: boolean;
  price?: number;
  interval?: string;
  renewalDate?: Date;
  status?: string;
  notes?: string | null;
};

export function HostingFields({
  clients,
  projects,
  d = {},
}: {
  clients: { id: string; name: string }[];
  projects: { id: string; title: string; clientId: string }[];
  d?: Defaults;
}) {
  const [clientId, setClientId] = useState(d.clientId ?? "");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Client"
          name="clientId"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          options={[{ value: "", label: "Choose a client…" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <SelectField
          label="Project (optional)"
          name="projectId"
          defaultValue={d.projectId ?? ""}
          options={[{ value: "", label: "None" }, ...projects.filter((p) => p.clientId === clientId).map((p) => ({ value: p.id, label: p.title }))]}
        />
        <TextField label="Domain" name="domain" placeholder="example.co.uk" defaultValue={d.domain} required />
        <TextField label="Hosting provider" name="provider" placeholder="e.g. Vercel, Netlify, 20i" defaultValue={d.provider} required />
        <TextField label="Plan name" name="planName" placeholder="e.g. Care Plan" defaultValue={d.planName ?? "Hosting & Care Plan"} required />
        <SelectField
          label="Status"
          name="status"
          defaultValue={d.status ?? "ACTIVE"}
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "PAUSED", label: "Paused" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
        <TextField
          label="Price (£)"
          name="price"
          inputMode="decimal"
          defaultValue={d.price !== undefined ? (d.price / 100).toFixed(2) : "49.00"}
          required
        />
        <SelectField
          label="Billing interval"
          name="interval"
          defaultValue={d.interval ?? "MONTHLY"}
          options={[
            { value: "MONTHLY", label: "Monthly" },
            { value: "ANNUAL", label: "Annual" },
          ]}
        />
        <TextField label="Next renewal date" name="renewalDate" type="date" defaultValue={dateInputValue(d.renewalDate)} required />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="includesMaintenance" defaultChecked={d.includesMaintenance ?? true} className="accent-[var(--brand-strong)]" />
        Includes maintenance (updates, backups, small content changes)
      </label>
      <TextAreaField
        label="Internal notes"
        name="notes"
        defaultValue={d.notes ?? ""}
        placeholder="DNS details, credentials location, maintenance log…"
      />
    </>
  );
}
