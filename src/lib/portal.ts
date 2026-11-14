// Pure logic for the client portal overview (no server-only, unit tested).

export type NextStep = "verify" | "pay" | "draft" | "review" | "project" | "start";

/** The single most useful thing to show a client first on their overview. */
export function portalNextStep(s: {
  verified: boolean;
  unpaidInvoices: number;
  draftQuotes: number;
  quotesInReview: number;
  activeProjects: number;
}): NextStep {
  if (!s.verified) return "verify";
  if (s.unpaidInvoices > 0) return "pay";
  if (s.draftQuotes > 0) return "draft";
  if (s.quotesInReview > 0) return "review";
  if (s.activeProjects > 0) return "project";
  return "start";
}

/** Plain-English line for a quote's status, shown to clients. */
export function quoteStatusNote(status: string): string | null {
  switch (status) {
    case "SUBMITTED":
    case "REVIEWING":
      return "We're reviewing this and usually reply within 2 working days.";
    case "ACCEPTED":
      return "Accepted. Follow progress under Projects.";
    case "DECLINED":
      return "This quote is closed.";
    default:
      return null;
  }
}
