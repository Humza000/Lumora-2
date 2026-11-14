import Link from "next/link";
import type { ReactNode } from "react";
import { ActionForm, SubmitButton } from "@/components/forms";
import { ButtonLink, Card, Eyebrow, PageHeader, ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import { resendVerification } from "@/app/(auth)/actions";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/dal";
import { effectiveStatus } from "@/lib/invoice";
import { formatGBP } from "@/lib/money";
import { portalNextStep } from "@/lib/portal";
import { projectProgress } from "@/lib/progress";

export default async function PortalHome() {
  const user = await requireClient();
  const [projects, invoices, quotes] = await Promise.all([
    db.project.findMany({
      where: { clientId: user.id, status: { not: "COMPLETED" } },
      include: { milestones: { select: { status: true, title: true }, orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.invoice.findMany({
      where: { clientId: user.id, status: { in: ["SENT", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
    }),
    db.quote.findMany({
      where: { userId: user.id, status: { in: ["DRAFT", "SUBMITTED", "REVIEWING"] } },
      select: { status: true },
    }),
  ]);

  const firstName = user.name.split(" ")[0];
  const step = portalNextStep({
    verified: Boolean(user.emailVerified),
    unpaidInvoices: invoices.length,
    draftQuotes: quotes.filter((q) => q.status === "DRAFT").length,
    quotesInReview: quotes.filter((q) => q.status !== "DRAFT").length,
    activeProjects: projects.length,
  });
  const lead = projects[0];
  const nextMilestone = lead?.milestones.find((m) => m.status !== "DONE");

  return (
    <>
      <PageHeader title={`Welcome back, ${firstName}`} />

      {step === "verify" && (
        <NextStep title="Verify your email" tone="warning">
          <p className="text-sm text-ink-muted">
            We sent a link to <strong className="text-ink">{user.email}</strong>. Click it to confirm your address, then you
            can request a quote. Check your spam folder if it hasn&apos;t arrived.
          </p>
          <ActionForm action={resendVerification} className="mt-4">
            <SubmitButton variant="secondary" pendingText="Sending…">
              Resend verification email
            </SubmitButton>
          </ActionForm>
        </NextStep>
      )}

      {step === "pay" && (
        <NextStep title={`You have ${invoices.length} invoice${invoices.length === 1 ? "" : "s"} to pay`} tone="warning">
          <ul className="space-y-2 text-sm">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link href={`/portal/invoices/${inv.id}`} className="font-medium text-brand-light hover:underline">
                  {inv.number}
                </Link>
                <span>{formatGBP(inv.total)}</span>
                <span className="text-ink-muted">due {formatDate(inv.dueDate)}</span>
                {effectiveStatus(inv.status, inv.dueDate) === "OVERDUE" && <StatusBadge status="OVERDUE" />}
              </li>
            ))}
          </ul>
          <ButtonLink href={invoices.length === 1 ? `/portal/invoices/${invoices[0].id}` : "/portal/invoices"} className="mt-4">
            {invoices.length === 1 ? "View & pay" : "View invoices"}
          </ButtonLink>
        </NextStep>
      )}

      {step === "draft" && (
        <NextStep title="Finish your quote">
          <p className="text-sm text-ink-muted">Your answers are saved. Pick up where you left off and send it to us.</p>
          <ButtonLink href="/quote" className="mt-4">
            Continue quote
          </ButtonLink>
        </NextStep>
      )}

      {step === "review" && (
        <NextStep title="We're reviewing your quote">
          <p className="text-sm text-ink-muted">
            We usually reply within 2 working days. Once your project starts, you&apos;ll follow every milestone here.
          </p>
          <ButtonLink href="/portal/quotes" variant="secondary" className="mt-4">
            View your quote
          </ButtonLink>
        </NextStep>
      )}

      {step === "project" && lead && (
        <NextStep title={nextMilestone ? `Up next: ${nextMilestone.title}` : "Your project is nearly there"}>
          <p className="text-sm text-ink-muted">
            {lead.title}
            {lead.dueDate ? ` · target launch ${formatDate(lead.dueDate)}` : ""}
          </p>
          <ButtonLink href={`/portal/projects/${lead.id}`} variant="secondary" className="mt-4">
            View timeline
          </ButtonLink>
        </NextStep>
      )}

      {step === "start" && (
        <NextStep title="Ready to start a project?">
          <p className="text-sm text-ink-muted">Answer a few questions and get an instant estimate. It takes about 3 minutes.</p>
          <ButtonLink href="/quote" className="mt-4">
            Get a quote
          </ButtonLink>
        </NextStep>
      )}

      {projects.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 text-lg font-semibold">Your projects</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/portal/projects/${p.id}`} className="block">
                <Card interactive className="h-full">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-5">
                    <ProgressBar value={projectProgress(p.milestones)} label="Progress" />
                  </div>
                  {p.dueDate && <p className="mt-3 text-xs text-ink-muted">Target launch {formatDate(p.dueDate)}</p>}
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function NextStep({ title, tone, children }: { title: string; tone?: "warning"; children: ReactNode }) {
  return (
    <Card className={tone === "warning" ? "border-warning/40 bg-warning/5" : undefined}>
      <Eyebrow>Next step</Eyebrow>
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </Card>
  );
}
