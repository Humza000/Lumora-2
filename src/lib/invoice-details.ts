// Invoice header details (package, hosting plan, project). Plain module, no React, so both the
// web view (components/invoice-view.tsx) and the PDF route can use it.
import { summariseQuote } from "./pricing";

type Linked = {
  project: { title: string } | null;
  hostingPlan: { domain: string } | null;
  quote: { answers: unknown } | null;
};

/** Package / hosting / project details shown in the invoice header (web and PDF). */
export function invoiceDetails(invoice: Linked) {
  const q = invoice.quote ? summariseQuote(invoice.quote.answers) : null;
  const hosting = [q?.hostingPlanName, invoice.hostingPlan?.domain].filter(Boolean).join(" · ");
  return [
    q?.packageName && { label: "Package", value: q.packageName },
    hosting && { label: "Hosting & care", value: hosting },
    invoice.project && { label: "Project", value: invoice.project.title },
  ].filter((x): x is { label: string; value: string } => Boolean(x));
}
