import type { ReactNode } from "react";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "./logo";
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
      {/* Ambient glow behind the content area */}
      <div className="pointer-events-none fixed top-[-20rem] right-[-10rem] -z-10 h-[40rem] w-[40rem] rounded-full bg-brand/15 blur-[140px]" aria-hidden />

      <aside className="glass border-x-0 border-t-0 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <Logo href={homeHref} />
          {badge && (
            <span className="rounded-md border border-brand-light/30 bg-brand-strong/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.15em] text-brand-light uppercase shadow-[0_0_14px_rgba(165,119,255,0.4)]">
              {badge}
            </span>
          )}
        </div>
        <SideNav items={nav} />
        <div className="hidden border-t border-line/60 p-4 md:mt-auto md:block">
          <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-light to-brand text-xs font-semibold text-canvas shadow-[0_0_16px_rgba(165,119,255,0.5)]">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
          </div>
          <form action={logout} className="mt-2 px-2">
            <button className="text-sm text-ink-muted transition-colors hover:text-brand-light">Log out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-8 sm:px-8 md:py-12">
        <div className="mx-auto max-w-6xl">{children}</div>
        <form action={logout} className="mt-10 text-center md:hidden">
          <button className="text-sm text-ink-muted">Log out</button>
        </form>
      </main>
    </div>
  );
}
