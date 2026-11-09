// Pure hosting/maintenance helpers.

export function advanceRenewal(date: Date, interval: "MONTHLY" | "ANNUAL"): Date {
  const next = new Date(date);
  const day = next.getDate();
  if (interval === "ANNUAL") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  // Clamp month overflow (e.g. 31 Jan + 1 month → 28/29 Feb, not 3 Mar).
  if (next.getDate() !== day) next.setDate(0);
  return next;
}

export function daysUntil(date: Date, now = new Date()) {
  return Math.ceil((date.getTime() - now.getTime()) / 86400_000);
}

/** Monthly-equivalent recurring revenue, in pence. */
export function monthlyValue(price: number, interval: "MONTHLY" | "ANNUAL") {
  return interval === "MONTHLY" ? price : Math.round(price / 12);
}

export function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86400_000);
}
