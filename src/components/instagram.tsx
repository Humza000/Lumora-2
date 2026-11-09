import { site } from "@/lib/site";
import { cn } from "./ui";

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cn("h-5 w-5", className)} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Instagram link: round icon button by default, or icon + @handle with `withHandle`. */
export function InstagramLink({ withHandle, className }: { withHandle?: boolean; className?: string }) {
  return (
    <a
      href={site.instagram.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${site.name} on Instagram (@${site.instagram.handle})`}
      className={cn(
        "group inline-flex items-center gap-2 transition-all duration-300",
        withHandle
          ? "font-medium text-brand-light hover:text-ink"
          : "h-10 w-10 justify-center rounded-full border border-line bg-surface text-ink-muted hover:-translate-y-0.5 hover:border-brand/50 hover:bg-brand hover:text-ink hover:shadow-[0_10px_24px_-10px_rgba(165,119,255,0.8)]",
        className,
      )}
    >
      <InstagramIcon />
      {withHandle && <span>@{site.instagram.handle}</span>}
    </a>
  );
}
