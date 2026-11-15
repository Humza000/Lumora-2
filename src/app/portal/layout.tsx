import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { TabSessionGuard } from "@/components/tab-session";
import { requireClient } from "@/lib/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Client portal", template: "%s | Lumora portal" }, robots: { index: false } };

const NAV = [
  { href: "/portal", label: "Overview", exact: true },
  { href: "/portal/projects", label: "Projects" },
  { href: "/portal/quotes", label: "Quotes" },
  { href: "/portal/invoices", label: "Invoices" },
];

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const user = await requireClient("/portal");
  // Only clients with a hosting plan see the Hosting page.
  const hasHosting = (await db.hostingPlan.count({ where: { clientId: user.id } })) > 0;
  const nav = hasHosting ? [...NAV, { href: "/portal/hosting", label: "Hosting" }] : NAV;
  return (
    <TabSessionGuard>
      <DashboardShell nav={nav} user={user} homeHref="/portal">
        {children}
      </DashboardShell>
    </TabSessionGuard>
  );
}
