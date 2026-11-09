"use client";

import { useMemo, useState } from "react";
import { ActionForm, FieldError, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms";
import { Button, Input, Label, dateInputValue } from "@/components/ui";
import type { ActionState } from "@/lib/action-state";
import { calculateTotals } from "@/lib/invoice";
import { formatGBP, poundsToPence } from "@/lib/money";

type Line = { description: string; quantity: string; unitPrice: string };
type Option = { id: string; label: string; clientId: string };

export type InvoiceFormDefaults = {
  clientId?: string;
  projectId?: string | null;
  hostingPlanId?: string | null;
  issueDate?: Date;
  dueDate?: Date;
  vatRate?: number;
  notes?: string | null;
  lines?: { description: string; quantity: number; unitPrice: number }[];
};

export function InvoiceForm({
  action,
  clients,
  projects,
  plans,
  d = {},
  submitLabel,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  clients: { id: string; name: string }[];
  projects: Option[];
  plans: Option[];
  d?: InvoiceFormDefaults;
  submitLabel: string;
}) {
  const [clientId, setClientId] = useState(d.clientId ?? "");
  const [vatRate, setVatRate] = useState(String(d.vatRate ?? 0));
  const [lines, setLines] = useState<Line[]>(
    d.lines?.length
      ? d.lines.map((l) => ({ description: l.description, quantity: String(l.quantity), unitPrice: (l.unitPrice / 100).toFixed(2) }))
      : [{ description: "", quantity: "1", unitPrice: "" }],
  );

  const totals = useMemo(() => {
    const parsed = lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity) || 0,
      unitPrice: poundsToPence(l.unitPrice) || 0,
    }));
    return calculateTotals(parsed, Number(vatRate) || 0);
  }, [lines, vatRate]);

  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const [{ today, in14 }] = useState(() => ({ today: new Date(), in14: new Date(Date.now() + 14 * 86400_000) }));

  return (
    <ActionForm action={action}>
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <div className="grid gap-4 sm:grid-cols-3">
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
          options={[{ value: "", label: "None" }, ...projects.filter((p) => p.clientId === clientId).map((p) => ({ value: p.id, label: p.label }))]}
        />
        <SelectField
          label="Hosting plan (optional)"
          name="hostingPlanId"
          defaultValue={d.hostingPlanId ?? ""}
          options={[{ value: "", label: "None" }, ...plans.filter((p) => p.clientId === clientId).map((p) => ({ value: p.id, label: p.label }))]}
        />
        <TextField label="Issue date" name="issueDate" type="date" defaultValue={dateInputValue(d.issueDate ?? today)} required />
        <TextField label="Due date" name="dueDate" type="date" defaultValue={dateInputValue(d.dueDate ?? in14)} required />
        <SelectField
          label="VAT"
          name="vatRate"
          value={vatRate}
          onChange={(e) => setVatRate(e.target.value)}
          options={[
            { value: "0", label: "0% (not VAT registered)" },
            { value: "20", label: "20% standard rate" },
            { value: "5", label: "5% reduced rate" },
          ]}
        />
      </div>

      <div>
        <Label>Line items</Label>
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_80px_120px_100px_32px] gap-2 text-xs text-ink-muted sm:grid">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit price (£)</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_120px_100px_32px] items-center gap-2">
              <Input aria-label="Description" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
              <Input aria-label="Quantity" type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
              <Input aria-label="Unit price" inputMode="decimal" placeholder="0.00" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} />
              <span className="text-right text-sm">{formatGBP((Number(l.quantity) || 0) * (poundsToPence(l.unitPrice) || 0))}</span>
              <button
                type="button"
                aria-label="Remove line"
                disabled={lines.length === 1}
                onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                className="text-ink-muted hover:text-danger disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <FieldError name="lines" prefix />
        <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setLines((ls) => [...ls, { description: "", quantity: "1", unitPrice: "" }])}>
          + Add line
        </Button>
      </div>

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-muted">Subtotal</span>
          <span>{formatGBP(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-muted">VAT ({vatRate}%)</span>
          <span>{formatGBP(totals.vat)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-1 font-semibold">
          <span>Total</span>
          <span>{formatGBP(totals.total)}</span>
        </div>
      </div>

      <TextAreaField label="Notes (shown on invoice)" name="notes" defaultValue={d.notes ?? ""} placeholder="e.g. Payment terms, bank details…" />
      <SubmitButton>{submitLabel}</SubmitButton>
    </ActionForm>
  );
}
