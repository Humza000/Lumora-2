import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { TabSessionGuard } from "@/components/tab-session";
import { requireClient } from "@/lib/dal";

export const metadata: Metadata = { title: { default: "Client portal", template: "%s | Lumora portal" }, robots: { index: false } };

const NAV = [
  { href: "/portal", label: "Overview", exact: true },
  { href: "/portal/projects", label: "Projects" },
  { href: "/portal/quotes", label: "Quotes" },
  { href: "/portal/invoices", label: "Invoices" },
];

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const user = await requireClient("/portal");
  return (
    <TabSessionGuard>
      <DashboardShell nav={NAV} user={user} homeHref="/portal">
        {children}
      </DashboardShell>
    </TabSessionGuard>
  );
}
