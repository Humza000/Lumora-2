"use client";

import { useMemo, useState } from "react";
import { ActionForm, FieldError, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms";
import { Button, Input, Label, dateInputValue } from "@/components/ui";
import type { ActionState } from "@/lib/action-state";
import { calculateTotals } from "@/lib/invoice";
import { formatGBP, poundsToPence } from "@/lib/money";
import type { InvoiceFormOptions } from "./options";

type Line = { description: string; quantity: string; unitPrice: string };
type Option = { id: string; label: string; clientId: string };
type QuoteOption = InvoiceFormOptions["quotes"][number];

const toLine = (l: { description: string; quantity: number; unitPrice: number }): Line => ({
  description: l.description,
  quantity: String(l.quantity),
  unitPrice: (l.unitPrice / 100).toFixed(2),
});
const isBlank = (ls: Line[]) => ls.every((l) => !l.description.trim() && !l.unitPrice.trim());

export type InvoiceFormDefaults = {
  clientId?: string;
  projectId?: string | null;
  hostingPlanId?: string | null;
  quoteId?: string | null;
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
  quotes,
  d = {},
  submitLabel,
  allowSend,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  clients: { id: string; name: string; email: string }[];
  projects: Option[];
  plans: Option[];
  quotes: QuoteOption[];
  d?: InvoiceFormDefaults;
  submitLabel: string;
  /** Show "Create & send to client" next to the save button. */
  allowSend?: boolean;
}) {
  const [clientId, setClientId] = useState(d.clientId ?? "");
  const [projectId, setProjectId] = useState(d.projectId ?? "");
  const [hostingPlanId, setHostingPlanId] = useState(d.hostingPlanId ?? "");
  const [quoteId, setQuoteId] = useState(d.quoteId ?? "");
  const [vatRate, setVatRate] = useState(String(d.vatRate ?? 0));
  const [lines, setLines] = useState<Line[]>(() => {
    if (d.lines?.length) return d.lines.map(toLine);
    // Opened from a project/quote: start from what the client picked.
    const fromQuote = quotes.find((q) => q.id === d.quoteId)?.summary.lines;
    return fromQuote?.length ? fromQuote.map(toLine) : [{ description: "", quantity: "1", unitPrice: "" }];
  });

  const clientProjects = projects.filter((p) => p.clientId === clientId);
  const clientPlans = plans.filter((p) => p.clientId === clientId);
  const clientQuotes = quotes.filter((q) => q.clientId === clientId);
  const quote = clientQuotes.find((q) => q.id === quoteId);

  function chooseClient(id: string) {
    setClientId(id);
    // Linked records belong to one client: clear them when the client changes.
    setProjectId("");
    setHostingPlanId("");
    const only = quotes.filter((q) => q.clientId === id);
    chooseQuote(only.length === 1 ? only[0].id : "");
  }

  function chooseQuote(id: string) {
    setQuoteId(id);
    const picked = quotes.find((q) => q.id === id);
    // Fill the line items from what they picked, unless lines have already been typed in.
    if (picked?.summary.lines.length) setLines((ls) => (isBlank(ls) ? picked.summary.lines.map(toLine) : ls));
  }

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
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Client (by email)"
          name="clientId"
          value={clientId}
          onChange={(e) => chooseClient(e.target.value)}
          options={[
            { value: "", label: "Choose a client…" },
            ...clients.map((c) => ({ value: c.id, label: c.name ? `${c.email} (${c.name})` : c.email })),
          ]}
        />
        <div>
          <SelectField
            label="What they picked (quote)"
            name="quoteId"
            value={quoteId}
            onChange={(e) => chooseQuote(e.target.value)}
            disabled={!clientId}
            options={[{ value: "", label: clientQuotes.length ? "None" : "No quotes from this client" }, ...clientQuotes.map((q) => ({ value: q.id, label: q.label }))]}
          />
        </div>
      </div>

      {quote && (
        <div className="rounded-xl border border-brand-light/25 bg-brand-soft/50 p-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
              <dt className="text-ink-muted">Package</dt>
              <dd className="font-medium">{quote.summary.packageName ?? "—"}</dd>
              <dt className="text-ink-muted">Hosting & care</dt>
              <dd className="font-medium">{quote.summary.hosting ?? "Not chosen"}</dd>
              <dt className="text-ink-muted">Features</dt>
              <dd>{quote.summary.features.join(", ") || "None selected"}</dd>
            </dl>
            {quote.summary.lines.length > 0 && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setLines(quote.summary.lines.map(toLine))}>
                Use as line items
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-muted">The package and hosting plan are shown on the invoice.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <SelectField
            label="Project (optional)"
            name="projectId"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={!clientProjects.length}
            options={[{ value: "", label: "None" }, ...clientProjects.map((p) => ({ value: p.id, label: p.label }))]}
          />
          {clientId && !clientProjects.length && (
            <p className="mt-1 text-xs text-ink-muted">No projects yet. Accepting their quote creates one.</p>
          )}
        </div>
        <div>
          <SelectField
            label="Hosting plan record (optional)"
            name="hostingPlanId"
            value={hostingPlanId}
            onChange={(e) => setHostingPlanId(e.target.value)}
            disabled={!clientPlans.length}
            options={[{ value: "", label: "None" }, ...clientPlans.map((p) => ({ value: p.id, label: p.label }))]}
          />
          {clientId && !clientPlans.length && (
            <p className="mt-1 text-xs text-ink-muted">None yet. Add one under Hosting & maintenance once their site is live.</p>
          )}
        </div>
        <div className="hidden sm:block" />
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
      <div className="flex flex-wrap gap-3">
        <SubmitButton variant={allowSend ? "secondary" : "primary"}>{submitLabel}</SubmitButton>
        {allowSend && (
          <SubmitButton name="intent" value="send" pendingText="Sending…">
            Create & send to client
          </SubmitButton>
        )}
      </div>
      {allowSend && (
        <p className="text-xs text-ink-muted">
          Sending gives the invoice its number and emails the client a link to view and pay it.
        </p>
      )}
    </ActionForm>
  );
}
