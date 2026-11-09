"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { optionalText } from "@/lib/validation";

const url = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null)
  .refine((v) => v === null || /^(https?:\/\/|\/)/.test(v), "Use a full https:// URL or a /path in public/");

const itemSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  title: z.string().trim().min(2).max(150),
  sector: z.string().trim().min(2).max(100),
  summary: z.string().trim().min(10).max(300),
  body: optionalText(10000),
  features: z
    .string()
    .optional()
    .transform((v) => (v ?? "").split("\n").map((f) => f.trim()).filter(Boolean)),
  imageUrl: url,
  liveUrl: url,
  featured: z.string().optional().transform((v) => v === "on"),
  published: z.string().optional().transform((v) => v === "on"),
  sortOrder: z.coerce.number().int().default(0),
});

const refresh = () => {
  revalidatePath("/");
  revalidatePath("/portfolio", "layout");
  revalidatePath("/admin/portfolio");
};

export async function savePortfolioItem(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = itemSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const clash = await db.portfolioItem.findFirst({ where: { slug: parsed.data.slug, NOT: id ? { id } : undefined } });
  if (clash) return { fieldErrors: { slug: ["Another project uses this slug"] } };

  if (id) await db.portfolioItem.update({ where: { id }, data: parsed.data });
  else await db.portfolioItem.create({ data: parsed.data });
  refresh();
  redirect("/admin/portfolio");
}

export async function deletePortfolioItem(id: string) {
  await requireAdmin();
  await db.portfolioItem.delete({ where: { id } });
  refresh();
  redirect("/admin/portfolio");
}
