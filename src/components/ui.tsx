import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Spotlight } from "./motion";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary:
    "shine bg-gradient-to-br from-brand to-brand-strong text-on-brand shadow-[0_8px_30px_-8px_color-mix(in_oklab,var(--brand)_65%,transparent),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--brand)_90%,transparent),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110",
  secondary:
    "border border-line bg-surface-2/60 text-ink backdrop-blur hover:border-brand-light/40 hover:bg-surface-2 hover:shadow-[0_0_24px_-8px_color-mix(in_oklab,var(--brand-tint)_50%,transparent)]",
  ghost: "text-ink hover:bg-brand-soft hover:text-ink",
  danger: "bg-danger/90 text-white hover:bg-danger",
};

export function buttonClass(variant: Variant = "primary", size: "sm" | "md" | "lg" = "md") {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-7 py-3.5 text-base" };
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
    variants[variant],
    sizes[size],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}

const cardBase = "ring-gradient rounded-2xl border border-line/60 bg-surface/80 p-6 shadow-[0_1px_2px_color-mix(in_oklab,var(--ink)_4%,transparent),0_8px_30px_-18px_color-mix(in_oklab,var(--brand-strong)_25%,transparent)]";

/** Card. `interactive` adds hover lift, glow and a cursor spotlight (use for clickable cards). */
export function Card({ className, interactive, ...props }: ComponentProps<"div"> & { interactive?: boolean }) {
  if (interactive) {
    return (
      <Spotlight
        className={cn(
          cardBase,
          "transition-all duration-300 hover:-translate-y-1 hover:border-brand-light/30 hover:shadow-[0_20px_50px_-20px_color-mix(in_oklab,var(--brand)_55%,transparent)]",
          className,
        )}
        {...props}
      />
    );
  }
  return <div className={cn(cardBase, className)} {...props} />;
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-line bg-surface-2/70 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 transition-all duration-200 hover:border-brand-light/25 focus:border-brand-light/60 focus:bg-surface-2 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_18%,transparent)] focus:outline-none";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputBase, "min-h-28", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputBase, "cursor-pointer", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink/90", className)} {...props} />;
}

const tones = {
  neutral: "bg-ink/5 text-ink-muted border-line",
  brand: "bg-brand-strong/15 text-brand-light border-brand-strong/30",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone])}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, keyof typeof tones> = {
  DRAFT: "neutral",
  SUBMITTED: "brand",
  REVIEWING: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  PLANNING: "neutral",
  IN_PROGRESS: "brand",
  REVIEW: "warning",
  COMPLETED: "success",
  ON_HOLD: "neutral",
  PENDING: "neutral",
  DONE: "success",
  SENT: "brand",
  PAID: "success",
  OVERDUE: "danger",
  VOID: "neutral",
  ACTIVE: "success",
  PAUSED: "warning",
  CANCELLED: "neutral",
};

export function humanize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{humanize(status)}</Badge>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label && (
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-ink-muted">{label}</span>
          <span className="font-medium tabular-nums">{value}%</span>
        </div>
      )}
      <div
        className="h-2 overflow-hidden rounded-full bg-ink/[0.05]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand via-brand-strong to-brand-light shadow-[0_0_12px_color-mix(in_oklab,var(--brand-tint)_70%,transparent)] transition-[width] duration-1000 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-12 text-center">
      <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-brand-strong/15 shadow-[0_0_30px_color-mix(in_oklab,var(--brand)_35%,transparent)]" aria-hidden />
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line/70 bg-surface/80">
      <table className="w-full text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-brand-strong/[0.06] [&_thead]:bg-ink/[0.015]">
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn("border-b border-line px-4 py-3 text-xs font-medium tracking-wide text-ink-muted uppercase", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-line/60 px-4 py-3.5", className)}>{children}</td>;
}

/** Small uppercase label above a section heading. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-brand-light uppercase", className)}>
      <span className="h-px w-6 bg-gradient-to-r from-transparent to-brand-light" aria-hidden />
      {children}
    </p>
  );
}

export function formatDate(d: Date | null | undefined) {
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

/** yyyy-mm-dd for <input type="date"> defaults */
export function dateInputValue(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "";
}
