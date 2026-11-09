import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Lumora admin" }, robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/quotes", label: "Quotes" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/hosting", label: "Hosting & maintenance" },
  { href: "/admin/portfolio", label: "Portfolio" },
  { href: "/admin/pricing", label: "Quote pricing" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return (
    <DashboardShell nav={NAV} user={user} homeHref="/admin" badge="Admin">
      {children}
    </DashboardShell>
  );
}
