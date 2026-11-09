export type MilestoneLike = { status: "PENDING" | "IN_PROGRESS" | "DONE" };

/** Percentage of milestones complete; in-progress milestones count as half. */
export function projectProgress(milestones: MilestoneLike[]): number {
  if (milestones.length === 0) return 0;
  const score = milestones.reduce(
    (sum, m) => sum + (m.status === "DONE" ? 1 : m.status === "IN_PROGRESS" ? 0.5 : 0),
    0,
  );
  return Math.round((score / milestones.length) * 100);
}

/** Default milestones created when a quote is converted into a project. */
export const DEFAULT_MILESTONES = [
  { title: "Discovery & planning", description: "Kick-off call, goals, sitemap and content plan." },
  { title: "Design", description: "Visual design and your review rounds." },
  { title: "Development", description: "Building the site and its features." },
  { title: "Content & testing", description: "Content population, QA across devices, performance checks." },
  { title: "Launch", description: "Go live, analytics and handover." },
];
