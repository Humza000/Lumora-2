import type { Metadata } from "next";
import { InstagramIcon } from "@/components/instagram";
import { Reveal } from "@/components/motion";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, Card } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with Lumora." };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
      <PageHero eyebrow="Contact" title={"Let's talk about your project"} />
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <Reveal className="flex">
          <Card interactive className="flex w-full flex-col p-9">
            <h2 className="font-display text-3xl font-semibold">Start a new project</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Our quote wizard takes about 3 minutes and gives you an instant indicative price. We&apos;ll follow up
              with a tailored proposal.
            </p>
            <ButtonLink href="/quote" className="mt-8 self-start">
              Get a quote <span aria-hidden>→</span>
            </ButtonLink>
          </Card>
        </Reveal>
        <Reveal delay={120} className="flex">
          <Card interactive className="flex w-full flex-col p-9">
            <h2 className="font-display text-3xl font-semibold">General enquiries</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">Questions, existing projects or partnerships: drop us a line.</p>
            <a
              href={`mailto:${site.email}`}
              className="group mt-8 inline-flex items-center gap-2 self-start text-lg font-medium text-brand-light"
            >
              {site.email}
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </Card>
        </Reveal>
      </div>
      <Reveal delay={200} className="mt-6">
        <a
          href={site.instagram.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group ring-gradient flex items-center justify-between gap-6 rounded-2xl border border-line/70 bg-surface/80 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_50px_-28px_rgba(106,59,224,0.45)]"
        >
          <div className="flex items-center gap-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-tint to-brand text-ink shadow-[0_10px_30px_-10px_rgba(165,119,255,0.8)] transition-transform duration-300 group-hover:scale-105">
              <InstagramIcon className="h-7 w-7" />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold">Follow our work on Instagram</p>
              <p className="text-sm text-ink-muted">Latest projects, behind-the-scenes and design inspiration.</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 font-medium text-brand-light sm:inline-flex">
            @{site.instagram.handle}
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
        </a>
      </Reveal>
    </div>
  );
}
