import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms";
import { MOCKUP_OPTIONS } from "@/components/mockups";
import type { ActionState } from "@/lib/action-state";
import { formatStats } from "@/lib/portfolio";

type Item = {
  slug: string;
  title: string;
  sector: string;
  summary: string;
  body: string | null;
  features: string[];
  imageUrl: string | null;
  liveUrl: string | null;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  client: string | null;
  location: string | null;
  year: number | null;
  services: string[];
  overview: string | null;
  challenge: string | null;
  approach: string | null;
  outcomes: string[];
  stats: unknown;
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  testimonialRole: string | null;
  mockup: string | null;
  concept: boolean;
};

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-line pt-6">
      <legend className="sr-only">{title}</legend>
      <div>
        <p className="font-display text-2xl font-semibold">{title}</p>
        {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export function PortfolioForm({ action, item }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; item?: Item }) {
  return (
    <ActionForm action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Title" name="title" defaultValue={item?.title} required />
        <TextField label="URL slug" name="slug" defaultValue={item?.slug} hint="e.g. miso-house" required />
        <TextField label="Sector" name="sector" defaultValue={item?.sector} placeholder="Hospitality · Restaurant" required />
        <TextField label="Sort order" name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} />
      </div>
      <TextField label="Summary (shown on cards)" name="summary" defaultValue={item?.summary} required />

      <Group title="Client details">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Client name" name="client" defaultValue={item?.client ?? ""} />
          <TextField label="Location" name="location" defaultValue={item?.location ?? ""} placeholder="Leeds" />
          <TextField label="Year" name="year" inputMode="numeric" defaultValue={item?.year ?? ""} placeholder="2026" />
        </div>
        <TextAreaField label="Services provided (one per line)" name="services" defaultValue={item?.services.join("\n")} className="[&_textarea]:min-h-24" />
      </Group>

      <Group title="Case study">
        <TextAreaField label="Who it's for (the client and their customers)" name="overview" defaultValue={item?.overview ?? ""} />
        <TextAreaField label="The brief / challenge" name="challenge" defaultValue={item?.challenge ?? ""} />
        <TextAreaField label="Our approach" name="approach" defaultValue={item?.approach ?? ""} />
        <TextAreaField label="Key features (one per line)" name="features" defaultValue={item?.features.join("\n")} />
        <TextAreaField
          label="What we delivered (one per line)"
          name="outcomes"
          defaultValue={item?.outcomes.join("\n")}
          hint="Describe what the site does for the client. Save measurable numbers for Results below."
        />
        <TextAreaField label="Extra notes (optional, shown at the end)" name="body" defaultValue={item?.body ?? ""} />
      </Group>

      <Group
        title="Results & testimonial"
        hint="Only enter REAL figures and quotes the client has confirmed. These sections stay hidden on the site until filled in."
      >
        <TextAreaField
          label="Results (one per line: value | label)"
          name="stats"
          defaultValue={formatStats(item?.stats)}
          placeholder={"e.g. 2x | online bookings in the first 3 months"}
          className="[&_textarea]:min-h-24"
        />
        <TextAreaField label="Testimonial quote" name="testimonialQuote" defaultValue={item?.testimonialQuote ?? ""} className="[&_textarea]:min-h-24" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Quote author" name="testimonialAuthor" defaultValue={item?.testimonialAuthor ?? ""} />
          <TextField label="Author role" name="testimonialRole" defaultValue={item?.testimonialRole ?? ""} placeholder="Owner, Miso House" />
        </div>
      </Group>

      <Group title="Visuals & visibility">
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Website mockup" name="mockup" defaultValue={item?.mockup ?? ""} options={MOCKUP_OPTIONS} />
          <TextField label="Image URL (overrides mockup on cards)" name="imageUrl" defaultValue={item?.imageUrl ?? ""} hint="https://… or /images/… in public/" />
          <TextField label="Live site URL" name="liveUrl" defaultValue={item?.liveUrl ?? ""} />
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="published" defaultChecked={item?.published ?? true} className="accent-[var(--brand-strong)]" />
            Published
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={item?.featured ?? false} className="accent-[var(--brand-strong)]" />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="concept" defaultChecked={item?.concept ?? false} className="accent-[var(--brand-strong)]" />
            Show &ldquo;Concept project&rdquo; badge
          </label>
        </div>
      </Group>
      <SubmitButton>Save project</SubmitButton>
    </ActionForm>
  );
}
