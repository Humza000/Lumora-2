"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { InstagramLink } from "./instagram";
import { Logo } from "./logo";
import { useTabSignedIn } from "./tab-session";
import { useScrolled } from "./motion";
import { buttonClass, cn } from "./ui";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();
  // Already logged in on this tab: go straight to the portal. Otherwise always ask to log in.
  const account = useTabSignedIn() ? { href: "/portal", label: "My portal" } : { href: "/login", label: "Client login" };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-500",
        scrolled || open ? "glass border-x-0 border-t-0 shadow-[0_10px_40px_-24px_color-mix(in_oklab,var(--ink)_25%,transparent)]" : "border-b border-transparent",
      )}
    >
      <div className={cn("mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-500 sm:px-6", scrolled ? "py-3" : "py-5")}>
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative rounded-full px-4 py-2 text-sm transition-colors duration-300",
                  active ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <span className="absolute inset-0 rounded-full bg-ink/[0.05] opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                <span className="relative">{item.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-4 -bottom-px h-px origin-left bg-gradient-to-r from-transparent via-brand-light to-transparent transition-transform duration-500",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link href={account.href} className="text-sm text-ink-muted transition-colors hover:text-ink">
            {account.label}
          </Link>
          <Link href="/quote" className={buttonClass("primary", "sm")}>
            Get a quote
          </Link>
        </div>
        <button
          className="rounded-lg p-2 text-ink transition-colors hover:bg-ink/5 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" className="border-t border-line/60 px-4 pt-2 pb-6 md:hidden" aria-label="Mobile">
          <div className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line/40 py-3.5 font-display text-2xl transition-colors hover:text-brand-light"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center justify-between py-4">
              <Link href={account.href} onClick={() => setOpen(false)} className="text-ink-muted">
                {account.label}
              </Link>
              <InstagramLink withHandle />
            </div>
            <Link href="/quote" onClick={() => setOpen(false)} className={buttonClass("primary")}>
              Get a quote
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
