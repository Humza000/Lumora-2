// Pure portfolio helpers (safe to unit test and to use in client components).

export type Stat = { value: string; label: string };

/** Parse admin "value | label" lines into stats. Lines without a "|" are ignored. */
export function parseStats(text: string): Stat[] {
  return text
    .split("\n")
    .map((line) => line.split("|").map((p) => p.trim()))
    .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
    .map(([value, ...rest]) => ({ value, label: rest.join(" | ") }))
    .slice(0, 6);
}

export function formatStats(stats: unknown): string {
  return readStats(stats)
    .map((s) => `${s.value} | ${s.label}`)
    .join("\n");
}

/** Safely read the `stats` JSON column. */
export function readStats(stats: unknown): Stat[] {
  if (!Array.isArray(stats)) return [];
  return stats.filter(
    (s): s is Stat => typeof s === "object" && s !== null && typeof s.value === "string" && typeof s.label === "string",
  );
}

/** "one per line" textarea → trimmed, non-empty list */
export function lines(text: string | undefined | null): string[] {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
