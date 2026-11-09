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
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-line bg-surface md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Logo href={homeHref} />
          {badge && <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">{badge}</span>}
        </div>
        <SideNav items={nav} />
        <div className="hidden border-t border-line p-5 md:mt-auto md:block">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-ink-muted">{user.email}</p>
          <form action={logout} className="mt-3">
            <button className="text-sm text-ink-muted hover:text-ink">Log out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-8 sm:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
        <form action={logout} className="mt-10 text-center md:hidden">
          <button className="text-sm text-ink-muted">Log out</button>
        </form>
      </main>
    </div>
  );
}
