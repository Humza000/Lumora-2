"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { poundsToPence } from "@/lib/money";
import { PRICING_CATALOGUE } from "@/lib/pricing";
import type { ActionState } from "@/lib/action-state";

export async function savePricing(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const errors: Record<string, string[]> = {};
  const updates: { key: string; label: string; category: string; price: number; sortOrder: number }[] = [];

  PRICING_CATALOGUE.forEach((item, i) => {
    const raw = String(fd.get(item.key) ?? "");
    // Timeline values are a whole-number percentage uplift, everything else is pounds.
    const price = item.category === "Timeline" ? (/^\d{1,3}$/.test(raw) ? Number(raw) : NaN) : poundsToPence(raw);
    if (!Number.isFinite(price)) errors[item.key] = ["Invalid value"];
    else updates.push({ ...item, price, sortOrder: i });
  });
  if (Object.keys(errors).length) return { error: "Some values are invalid.", fieldErrors: errors };

  await db.$transaction(
    updates.map((u) => db.pricingItem.upsert({ where: { key: u.key }, create: u, update: { price: u.price, label: u.label } })),
  );
  revalidatePath("/admin/pricing");
  return { ok: true, message: "Prices updated. New quotes will use these prices." };
}
