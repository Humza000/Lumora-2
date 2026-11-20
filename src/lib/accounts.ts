import "server-only";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { emails } from "./email";
import { createSession } from "./session";
import { issueToken } from "./tokens";
import type { Prisma } from "@/generated/prisma/client";

type NewClient = { name: string; email: string; company?: string; password: string };

/**
 * Creates a client account (optionally with its first quote, in the same write), emails the
 * verification link and signs them in as unverified. Returns null if the email is taken.
 */
export async function createClientAccount(
  { name, email, company, password }: NewClient,
  { next, quote }: { next: string; quote?: Prisma.QuoteCreateWithoutUserInput },
) {
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) return null;

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "CLIENT",
      profile: { create: { company: company || null } },
      ...(quote && { quotes: { create: quote } }),
    },
    include: { quotes: { select: { id: true } } },
  });

  const token = await issueToken(user.id, "EMAIL_VERIFICATION");
  const sent = await emails.verifyEmail(email, name, token, next);
  await createSession({ userId: user.id, role: "CLIENT", verified: false });
  return { user, sent, quoteId: user.quotes[0]?.id ?? null };
}
