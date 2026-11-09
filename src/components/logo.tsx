import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "./ui";

/**
 * LUMORA wordmark, recreated from the brand logo as an inline SVG so it stays
 * crisp, uses the display serif and inherits theme colours. Static copy of the
 * same mark: public/logo.svg. App icon: src/app/icon.png.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 176 32" className={cn("h-7 w-auto", className)} role="img" aria-label={site.name}>
      <g className="fill-brand-light/60">
        <circle cx="2.5" cy="7" r="1.5" />
        <circle cx="2.5" cy="25" r="1.5" />
        <circle cx="173.5" cy="7" r="1.5" />
        <circle cx="173.5" cy="25" r="1.5" />
      </g>
      <text
        x="88"
        y="24"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 26, letterSpacing: "0.32em" }}
      >
        {/* letter-spacing adds trailing space after the last letter; nudge to keep it centred */}
        <tspan dx="4">LUMORA</tspan>
      </text>
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${site.name} home`}
      className={cn(
        "group inline-flex items-center text-ink transition-[filter,color] duration-300 hover:text-brand-light hover:drop-shadow-[0_0_14px_rgba(203,181,255,0.65)]",
        className,
      )}
    >
      <Wordmark />
    </Link>
  );
}
