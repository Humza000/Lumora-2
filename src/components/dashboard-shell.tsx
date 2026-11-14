import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "./logo";
import { LogoutButton } from "./tab-session";
import { SideNav, type NavItem } from "./side-nav";

export function DashboardShell({
  nav,
  user,
  homeHref,
  badge,
  children,
}: {
  nav: NavItem[];
  user: { name: string; email: string };
  homeHref: string;
  badge?: string;
  children: ReactNode;
}) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      {/* Soft ambient tint behind the content area */}
      <div className="pointer-events-none fixed top-[-20rem] right-[-10rem] -z-10 h-[40rem] w-[40rem] rounded-full bg-brand/10 blur-[140px]" aria-hidden />

      <aside className="glass border-x-0 border-t-0 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center gap-2 px-5 py-5 md:py-6">
          <Logo href={homeHref} />
          {badge && (
            <span className="rounded-md border border-brand-light/30 bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.15em] text-brand-light uppercase">
              {badge}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <Link href="/" className="rounded-lg px-2 py-1 text-sm text-ink-muted transition-colors hover:text-brand-light">
              Homepage
            </Link>
            <LogoutButton action={logout} className="rounded-lg px-2 py-1 text-sm text-ink-muted transition-colors hover:text-brand-light" />
          </div>
        </div>
        <SideNav items={nav} />
        <div className="hidden px-3 pt-2 md:block">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-ink-muted transition-colors hover:bg-ink/[0.035] hover:text-ink"
          >
            <span aria-hidden>←</span> Back to website
          </Link>
        </div>
        <div className="hidden border-t border-line/60 p-4 md:mt-auto md:block">
          <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ink/[0.035]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-on-brand">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
          </div>
          <div className="mt-2 px-2">
            <LogoutButton action={logout} className="text-sm text-ink-muted transition-colors hover:text-brand-light" />
          </div>
        </div>
      </aside>
      <main className="flex-1 px-4 py-8 sm:px-8 md:py-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
