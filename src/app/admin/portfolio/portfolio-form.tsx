import { ActionForm, SubmitButton, TextAreaField, TextField } from "@/components/forms";
import type { ActionState } from "@/lib/action-state";

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
};

export function PortfolioForm({ action, item }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; item?: Item }) {
  return (
    <ActionForm action={action}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Title" name="title" defaultValue={item?.title} required />
        <TextField label="URL slug" name="slug" defaultValue={item?.slug} hint="e.g. peak-performance-gym" required />
        <TextField label="Sector" name="sector" defaultValue={item?.sector} placeholder="Business · Health & Fitness" required />
        <TextField label="Sort order" name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} />
      </div>
      <TextField label="Summary" name="summary" defaultValue={item?.summary} required />
      <TextAreaField label="Case study (optional)" name="body" defaultValue={item?.body ?? ""} className="[&_textarea]:min-h-40" />
      <TextAreaField label="Key features (one per line)" name="features" defaultValue={item?.features.join("\n")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Image URL" name="imageUrl" defaultValue={item?.imageUrl ?? ""} hint="https://… or /images/… in public/" />
        <TextField label="Live site URL" name="liveUrl" defaultValue={item?.liveUrl ?? ""} />
      </div>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={item?.published ?? true} className="accent-[var(--brand-strong)]" />
          Published
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={item?.featured ?? false} className="accent-[var(--brand-strong)]" />
          Featured on homepage
        </label>
      </div>
      <SubmitButton>Save project</SubmitButton>
    </ActionForm>
  );
}
