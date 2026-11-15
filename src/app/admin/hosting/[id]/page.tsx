import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Button, Card, PageHeader, StatusBadge, formatDate } from "@/components/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { advanceRenewal, daysUntil, hostingBillingState } from "@/lib/hosting";
import { effectiveStatus } from "@/lib/invoice";
import { formatGBP } from "@/lib/money";
import { invoiceNextPeriod, updateHostingPlan } from "../../_actions/hosting";
import { HostingFields } from "../hosting-fields";

export default async function AdminHostingPlan({ params }: PageProps<"/admin/hosting/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [plan, clients, projects] = await Promise.all([
    db.hostingPlan.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
        invoices: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.user.findMany({ where: { role: "CLIENT" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.project.findMany({ select: { id: true, title: true, clientId: true } }),
  ]);
  if (!plan) notFound();

  const days = daysUntil(plan.renewalDate);
  const billing = hostingBillingState(plan);
  const automatic = billing === "active" || billing === "past_due";
  const BILLING_TEXT = {
    manual: "Invoiced each period. The client can switch to automatic card payments from their portal.",
    active: "Automatic card payments (Stripe). Each payment is recorded as a paid invoice below.",
    past_due: "Automatic card payments, but the last payment failed. Stripe is retrying and the client has been asked to update their card.",
    cancelling: `Cancelled by the client. Ends on ${formatDate(plan.cancelAt)} and won't renew.`,
    cancelled: "Ended. No further payments.",
  } as const;

  return (
    <>
      <Link href="/admin/hosting" className="text-sm text-ink-muted hover:text-ink">
        ← All plans
      </Link>
      <div className="mt-4">
        <PageHeader
          title={plan.domain}
          description={
            <>
              <Link href={`/admin/clients/${plan.client.id}`} className="text-brand-light hover:underline">
                {plan.client.name}
              </Link>
              {plan.project && (
                <>
                  {" · "}
                  <Link href={`/admin/projects/${plan.project.id}`} className="text-brand-light hover:underline">
                    {plan.project.title}
                  </Link>
                </>
              )}
            </>
          }
          actions={<StatusBadge status={plan.status} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Plan details</h2>
          <ActionForm action={updateHostingPlan.bind(null, plan.id)}>
            <HostingFields clients={clients} projects={projects} d={plan} />
            <SubmitButton variant="secondary">Save</SubmitButton>
          </ActionForm>
        </Card>

        <div className="space-y-6">
          <Card className={billing === "past_due" || billing === "cancelling" ? "border-warning/40" : undefined}>
            <h2 className="font-semibold">Billing</h2>
            <p className="mt-2 text-sm">{BILLING_TEXT[billing]}</p>
            {automatic && (
              <p className="mt-2 text-xs text-ink-muted">
                Changing the price or interval here doesn&apos;t change the card subscription. Ask the client to cancel and set up
                payments again, or change it in Stripe.
              </p>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold">Renewal</h2>
            <p className="mt-2 text-2xl font-semibold">{formatDate(plan.renewalDate)}</p>
            <p className={days < 0 ? "text-sm text-danger" : "text-sm text-ink-muted"}>
              {days < 0 ? `${-days} days overdue` : `in ${days} days`}
            </p>
            {billing === "manual" && plan.status === "ACTIVE" && (
              <>
                <p className="mt-4 text-sm text-ink-muted">
                  Creates a draft invoice for {formatGBP(plan.price)} covering {formatDate(plan.renewalDate)} –{" "}
                  {formatDate(advanceRenewal(plan.renewalDate, plan.interval))}, and moves the renewal date forward.
                </p>
                <form action={invoiceNextPeriod.bind(null, plan.id)} className="mt-4">
                  <Button>Invoice next period</Button>
                </form>
              </>
            )}
            {automatic && <p className="mt-4 text-sm text-ink-muted">Charged automatically on this date.</p>}
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">Invoices</h2>
            {plan.invoices.length === 0 ? (
              <p className="text-sm text-ink-muted">No invoices yet</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {plan.invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-2">
                    <Link href={`/admin/invoices/${inv.id}`} className="text-brand-light hover:underline">
                      {inv.number ?? "Draft"}
                    </Link>
                    <span>{formatGBP(inv.total)}</span>
                    <StatusBadge status={effectiveStatus(inv.status, inv.dueDate)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
