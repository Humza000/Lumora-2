import Link from "next/link";
import { Badge, ButtonLink, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";

export const metadata = { title: "Portfolio" };

export default async function AdminPortfolio() {
  await requireAdmin();
  const items = await db.portfolioItem.findMany({ orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] });

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Case studies shown on the public Work page."
        actions={<ButtonLink href="/admin/portfolio/new">Add project</ButtonLink>}
      />
      {items.length === 0 ? (
        <EmptyState title="No portfolio items" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Sector</Th>
              <Th>Order</Th>
              <Th>Visibility</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <Td>
                  <Link href={`/admin/portfolio/${i.id}`} className="font-medium text-brand hover:underline">
                    {i.title}
                  </Link>
                  <p className="text-xs text-ink-muted">/portfolio/{i.slug}</p>
                </Td>
                <Td>{i.sector}</Td>
                <Td>{i.sortOrder}</Td>
                <Td className="space-x-1">
                  {i.published ? <Badge tone="success">Published</Badge> : <Badge>Hidden</Badge>}
                  {i.featured && <Badge tone="brand">Featured</Badge>}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
