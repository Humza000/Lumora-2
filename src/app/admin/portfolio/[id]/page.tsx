import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { deletePortfolioItem, savePortfolioItem } from "../../_actions/portfolio";
import { PortfolioForm } from "../portfolio-form";

export default async function EditPortfolioItem({ params }: PageProps<"/admin/portfolio/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const item = await db.portfolioItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <>
      <Link href="/admin/portfolio" className="text-sm text-ink-muted hover:text-ink">
        ← Portfolio
      </Link>
      <div className="mt-4">
        <PageHeader
          title={item.title}
          actions={
            <>
              <Link href={`/portfolio/${item.slug}`} target="_blank" className="text-sm text-brand-light hover:underline">
                View live ↗
              </Link>
              <form action={deletePortfolioItem.bind(null, item.id)}>
                <Button variant="ghost" size="sm" className="text-danger">
                  Delete
                </Button>
              </form>
            </>
          }
        />
      </div>
      <Card className="max-w-3xl">
        <PortfolioForm action={savePortfolioItem.bind(null, item.id)} item={item} />
      </Card>
    </>
  );
}
