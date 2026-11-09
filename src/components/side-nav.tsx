"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./ui";

export type NavItem = { href: string; label: string; exact?: boolean };

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0" aria-label="Dashboard">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-xl px-3.5 py-2.5 text-sm whitespace-nowrap transition-all duration-300",
              active
                ? "bg-gradient-to-r from-brand-strong/25 to-brand-strong/5 font-medium text-white shadow-[inset_0_0_0_1px_rgba(203,181,255,0.2)]"
                : "text-ink-muted hover:translate-x-0.5 hover:bg-white/[0.04] hover:text-ink",
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute top-1/2 left-0 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-light shadow-[0_0_10px_rgba(203,181,255,0.9)] md:block"
              />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
