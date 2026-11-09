"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { emails } from "@/lib/email";
import { issueToken } from "@/lib/tokens";
import { fromZodError, formToObject, type ActionState } from "@/lib/action-state";
import { optionalText } from "@/lib/validation";

const clientSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(100),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  company: optionalText(120),
  phone: optionalText(40),
  address: optionalText(500),
});

/** Create a client account and email them an invitation to set a password. */
export async function inviteClient(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = clientSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const { name, email, ...profile } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { fieldErrors: { email: ["A user with this email already exists."] } };
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      role: "CLIENT",
      // Unusable random password until the invite is accepted.
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
      profile: { create: profile },
    },
  });
  const token = await issueToken(user.id, "INVITE");
  await emails.invite(email, name, token);
  redirect(`/admin/clients/${user.id}`);
}

export async function updateClient(userId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = clientSchema.safeParse(formToObject(fd));
  if (!parsed.success) return fromZodError(parsed.error);
  const { name, email, ...profile } = parsed.data;

  const clash = await db.user.findFirst({ where: { email, NOT: { id: userId } } });
  if (clash) return { fieldErrors: { email: ["Another user already has this email."] } };

  await db.user.update({
    where: { id: userId, role: "CLIENT" },
    data: { name, email, profile: { upsert: { create: profile, update: profile } } },
  });
  revalidatePath(`/admin/clients/${userId}`);
  return { ok: true, message: "Client saved." };
}

export async function resendInvite(userId: string): Promise<ActionState> {
  await requireAdmin();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "CLIENT") return { error: "Client not found." };
  const token = await issueToken(user.id, "INVITE");
  await emails.invite(user.email, user.name, token);
  return { ok: true, message: `Invitation sent to ${user.email}.` };
}
