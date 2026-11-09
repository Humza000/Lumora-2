import Link from "next/link";
import { site } from "@/lib/site";
import { Logo, Wordmark } from "./logo";

const linkClass = "text-ink-muted transition-colors duration-300 hover:text-brand-light";

export function SiteFooter() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line/60">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-light/50 to-transparent" aria-hidden />
      <div className="absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-muted">{site.description}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-ink uppercase">Studio</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/services" className={linkClass}>Services</Link></li>
            <li><Link href="/portfolio" className={linkClass}>Our work</Link></li>
            <li><Link href="/about" className={linkClass}>About</Link></li>
            <li><Link href="/contact" className={linkClass}>Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-ink uppercase">Clients</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/quote" className={linkClass}>Get a quote</Link></li>
            <li><Link href="/login" className={linkClass}>Client login</Link></li>
            <li><a href={`mailto:${site.email}`} className={linkClass}>{site.email}</a></li>
          </ul>
        </div>
      </div>
      {/* Oversized faint wordmark */}
      <div className="pointer-events-none relative mx-auto max-w-6xl px-4 sm:px-6" aria-hidden>
        <Wordmark className="h-auto w-full text-white/[0.035] [&_g]:hidden" />
      </div>
      <div className="relative border-t border-line/50 py-6 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
