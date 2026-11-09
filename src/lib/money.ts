// All money is stored and computed as integer pence.

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function formatGBP(pence: number, opts: { whole?: boolean } = {}) {
  return (opts.whole ? gbpWhole : gbp).format(pence / 100);
}

/** Parse a user-entered pounds value ("1,250.50") into pence. Returns NaN if invalid. */
export function poundsToPence(input: string | number): number {
  const str = String(input).replace(/[£,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(str)) return NaN;
  return Math.round(Number(str) * 100);
}

export function penceToPounds(pence: number) {
  return (pence / 100).toFixed(2);
}
