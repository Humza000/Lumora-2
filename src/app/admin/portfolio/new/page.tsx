import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/dal";
import { savePortfolioItem } from "../../_actions/portfolio";
import { PortfolioForm } from "../portfolio-form";

export const metadata = { title: "Add portfolio project" };

export default async function NewPortfolioItem() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add portfolio project" />
      <Card className="max-w-3xl">
        <PortfolioForm action={savePortfolioItem.bind(null, null)} />
      </Card>
    </>
  );
}
