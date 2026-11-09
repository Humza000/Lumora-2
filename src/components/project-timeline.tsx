import { cn, formatDate, StatusBadge } from "./ui";

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  dueDate: Date | null;
  completedAt: Date | null;
};

/** Vertical milestone timeline shown to clients (and previewed in admin). */
export function ProjectTimeline({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return <p className="text-sm text-ink-muted">Your project timeline will appear here once planning is complete.</p>;
  }
  return (
    <ol className="relative">
      {milestones.map((m, i) => {
        const last = i === milestones.length - 1;
        return (
          <li key={m.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn("absolute top-7 left-[13px] h-[calc(100%-1.5rem)] w-0.5", m.status === "DONE" ? "bg-brand" : "bg-line")}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                m.status === "DONE" && "border-brand bg-brand text-white",
                m.status === "IN_PROGRESS" && "border-brand bg-surface text-brand",
                m.status === "PENDING" && "border-line bg-surface text-ink-muted",
              )}
            >
              {m.status === "DONE" ? "✓" : i + 1}
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn("font-medium", m.status === "PENDING" && "text-ink-muted")}>{m.title}</h3>
                <StatusBadge status={m.status} />
              </div>
              {m.description && <p className="mt-1 text-sm text-ink-muted">{m.description}</p>}
              <p className="mt-1 text-xs text-ink-muted">
                {m.status === "DONE" && m.completedAt
                  ? `Completed ${formatDate(m.completedAt)}`
                  : m.dueDate
                    ? `Target ${formatDate(m.dueDate)}`
                    : null}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function UpdatesFeed({ updates }: { updates: { id: string; body: string; createdAt: Date }[] }) {
  if (updates.length === 0) return <p className="text-sm text-ink-muted">No updates yet.</p>;
  return (
    <ul className="space-y-4">
      {updates.map((u) => (
        <li key={u.id} className="rounded-lg bg-canvas p-4">
          <p className="text-xs text-ink-muted">{formatDate(u.createdAt)}</p>
          <p className="mt-1 text-sm whitespace-pre-line">{u.body}</p>
        </li>
      ))}
    </ul>
  );
}
