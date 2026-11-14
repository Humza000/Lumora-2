import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import type { TokenType } from "@/generated/prisma/client";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

const TTL_HOURS: Record<TokenType, number> = {
  EMAIL_VERIFICATION: 24,
  INVITE: 24 * 7,
  PASSWORD_RESET: 1,
};

/** Creates a single-use token. Only the hash is stored; the raw token goes in the email link. */
export async function issueToken(userId: string, type: TokenType) {
  const raw = randomBytes(32).toString("base64url");
  await db.authToken.deleteMany({ where: { userId, type, usedAt: null } });
  await db.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hash(raw),
      expiresAt: new Date(Date.now() + TTL_HOURS[type] * 3600_000),
    },
  });
  return raw;
}

/** Validates and marks a token used. Returns the userId or null. */
export async function consumeToken(raw: string, type: TokenType) {
  const token = await db.authToken.findUnique({ where: { tokenHash: hash(raw) } });
  if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date()) return null;
  // Conditional update guards against double-use races.
  const res = await db.authToken.updateMany({
    where: { id: token.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return res.count === 1 ? token.userId : null;
}

/**
 * The owner of a token that has already been used (e.g. a verification link clicked twice,
 * or pre-opened by a mail scanner), so the caller can treat it as "already done" not "invalid".
 */
export async function usedTokenUser(raw: string, type: TokenType) {
  const token = await db.authToken.findUnique({
    where: { tokenHash: hash(raw) },
    include: { user: { select: { id: true, role: true, emailVerified: true } } },
  });
  if (!token || token.type !== type || !token.usedAt) return null;
  return token.user;
}

/** Look up a token without consuming it (e.g. to render the invite form). */
export async function peekToken(raw: string, type: TokenType) {
  const token = await db.authToken.findUnique({
    where: { tokenHash: hash(raw) },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date()) return null;
  return token;
}
