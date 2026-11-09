// Pure JWT helpers (no next/headers) so they can be used from proxy.ts as well.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "lumora_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Role = "ADMIN" | "CLIENT";

export type SessionPayload = {
  userId: string;
  role: Role;
  verified: boolean;
};

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string") return null;
    if (payload.role !== "ADMIN" && payload.role !== "CLIENT") return null;
    return { userId: payload.userId, role: payload.role, verified: payload.verified === true };
  } catch {
    return null;
  }
}
