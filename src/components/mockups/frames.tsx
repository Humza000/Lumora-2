import type { ReactNode } from "react";
import { cn } from "../ui";

/** Desktop browser window. Children are a mockup designed at 1280px wide (see `mock-desktop`). */
export function BrowserFrame({ url, children, className }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_80px_-40px_rgba(21,10,53,0.35)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-surface-2/80 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex max-w-xs flex-1 items-center justify-center gap-1.5 rounded-md bg-surface px-3 py-1 text-[11px] text-ink-muted">
          <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor" aria-hidden>
            <path d="M2 4V3a2.5 2.5 0 015 0v1h.5A1.5 1.5 0 019 5.5v3A1.5 1.5 0 017.5 10h-6A1.5 1.5 0 010 8.5v-3A1.5 1.5 0 011.5 4H2zm1 0h3V3a1.5 1.5 0 00-3 0v1z" />
          </svg>
          <span className="truncate">{url}</span>
        </div>
        <span className="w-10" aria-hidden />
      </div>
      <div className="[container-type:inline-size]">
        <div className="mock-desktop aspect-[16/10] overflow-hidden" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Phone. Children are a mockup designed at 390px wide (see `mock-phone`). */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[2.4rem] border border-line bg-ink p-2 shadow-[0_40px_80px_-40px_rgba(21,10,53,0.45)]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-surface [container-type:inline-size]">
        <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
        <div className="mock-phone aspect-[390/800] overflow-hidden" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Just the scaled canvas (no chrome): used for card thumbnails. */
export function MockCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="[container-type:inline-size]">
      <div className="mock-desktop aspect-[16/10] overflow-hidden" aria-hidden>
        {children}
      </div>
    </div>
  );
}
