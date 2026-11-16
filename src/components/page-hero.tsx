import type { ReactNode } from "react";
import { Reveal } from "./motion";
import { Eyebrow } from "./ui";

/** Header block for inner public pages: eyebrow, display heading, intro, ambient glow. */
export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative isolate">
      <div className="absolute inset-x-0 -top-72 -z-10 h-[40rem] bg-[radial-gradient(20rem_circle_at_calc(25%_+_12rem)_50%,color-mix(in_oklab,var(--brand)_26%,transparent),transparent)]" aria-hidden />
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={80}>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[1.02] font-semibold tracking-tight md:text-7xl">{title}</h1>
      </Reveal>
      {children && (
        <Reveal delay={160}>
          <div className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">{children}</div>
        </Reveal>
      )}
    </section>
  );
}
