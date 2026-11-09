import { ActionForm, SubmitButton, TextField } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/dal";
import { getPriceMap } from "@/lib/prices";
import { PRICING_CATALOGUE } from "@/lib/pricing";
import { savePricing } from "../_actions/pricing";

export const metadata = { title: "Quote pricing" };

export default async function AdminPricing() {
  await requireAdmin();
  const prices = await getPriceMap();
  const categories = [...new Set(PRICING_CATALOGUE.map((p) => p.category))];

  return (
    <>
      <PageHeader
        title="Quote pricing"
        description="Prices used by the quote wizard's live estimate. Clients see a range of −10% / +20% around the total."
      />
      <ActionForm action={savePricing} className="max-w-3xl space-y-6">
        {categories.map((cat) => (
          <Card key={cat}>
            <h2 className="mb-4 font-semibold">{cat}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {PRICING_CATALOGUE.filter((p) => p.category === cat).map((p) => (
                <TextField
                  key={p.key}
                  label={cat === "Timeline" ? `${p.label}` : `${p.label} (£)`}
                  name={p.key}
                  inputMode="decimal"
                  defaultValue={cat === "Timeline" ? String(prices[p.key] ?? 0) : ((prices[p.key] ?? 0) / 100).toFixed(2)}
                />
              ))}
            </div>
          </Card>
        ))}
        <SubmitButton>Save prices</SubmitButton>
      </ActionForm>
    </>
  );
}
