import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with Lumora." };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <p className="text-sm font-medium text-brand">Contact</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Let&apos;s talk about your project</h1>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-8">
          <h2 className="text-lg font-semibold">Start a new project</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Our quote wizard takes about 3 minutes and gives you an instant indicative price. We&apos;ll follow up
            with a tailored proposal.
          </p>
          <ButtonLink href="/quote" className="mt-6">
            Get a quote
          </ButtonLink>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-8">
          <h2 className="text-lg font-semibold">General enquiries</h2>
          <p className="mt-2 text-sm text-ink-muted">Questions, existing projects or partnerships: drop us a line.</p>
          <a href={`mailto:${site.email}`} className="mt-6 inline-block font-medium text-brand hover:underline">
            {site.email}
          </a>
        </div>
      </div>
    </div>
  );
}
