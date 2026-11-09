import Link from "next/link";
import { Badge, ButtonLink, EmptyState, PageHeader, Table, Td, Th, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "Clients" };

export default async function AdminClients() {
  await requireAdmin();
  const clients = await db.user.findMany({
    where: { role: "CLIENT" },
    include: { profile: true, _count: { select: { projects: true, quotes: true, hostingPlans: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Clients" actions={<ButtonLink href="/admin/clients/new">Invite client</ButtonLink>} />
      {clients.length === 0 ? (
        <EmptyState title="No clients yet" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Company</Th>
              <Th>Projects</Th>
              <Th>Quotes</Th>
              <Th>Hosting</Th>
              <Th>Joined</Th>
              <Th>Account</Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <Td>
                  <Link href={`/admin/clients/${c.id}`} className="font-medium text-brand hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-xs text-ink-muted">{c.email}</p>
                </Td>
                <Td>{c.profile?.company ?? "—"}</Td>
                <Td>{c._count.projects}</Td>
                <Td>{c._count.quotes}</Td>
                <Td>{c._count.hostingPlans}</Td>
                <Td>{formatDate(c.createdAt)}</Td>
                <Td>{c.emailVerified ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Pending</Badge>}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
